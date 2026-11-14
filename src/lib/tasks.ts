import { db } from "@/db";
import {
  tasks, taskEvents, plans, offers, payments, ledgerEntries, customerProfiles, helperProfiles, reviews, shellNotes,
  sosEvents, users, addresses, requests, categories, circleMembers, circles, payouts, towers, type ChangeReq,
} from "@/db/schema";
import { and, eq, lt, inArray, sql, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { ApiError } from "./api";
import { notify, notifyOps } from "./notify";
import { doorOtp, editPlan } from "./plans";
import { dispatchTask, candidatesFor } from "./dispatch";
import { getFlags, getPricing } from "./settings";
import { haversine, GEOFENCE_M } from "./geo";
import { sha } from "./auth";
import type { Urgency } from "./pricing";

const rupee = (p: number) => Math.round(p / 100) * 100;
export type Actor = { id: string; role: string };

// ---------- ledger ----------
export type Leg = { account: string; debit?: number; credit?: number; memo?: string };
export function journalBalanced(legs: Leg[]) {
  return legs.reduce((s, l) => s + (l.debit ?? 0) - (l.credit ?? 0), 0) === 0;
}
export async function postJournal(legs: Leg[], refType: string, refId: string) {
  const live = legs.filter((l) => (l.debit ?? 0) !== 0 || (l.credit ?? 0) !== 0);
  if (!journalBalanced(live)) throw new Error("Unbalanced journal");
  if (!live.length) return;
  const journalId = randomUUID();
  await db.insert(ledgerEntries).values(live.map((l) => ({ journalId, account: l.account, debit: l.debit ?? 0, credit: l.credit ?? 0, refType, refId, memo: l.memo ?? "" })));
}

export async function logEvent(taskId: string, type: string, actorId: string | null, note = "") {
  await db.insert(taskEvents).values({ taskId, type, actorId, note });
}

export const LEVELS = [
  { name: "STARTER", label: "Starter", min: 0, rating: 0 },
  { name: "TRUSTED", label: "Trusted", min: 11, rating: 4.6 },
  { name: "PRO", label: "Pro", min: 41, rating: 4.6 },
  { name: "ELITE", label: "Elite", min: 121, rating: 4.8 },
];
export function levelFor(jobs: number, rating: number) {
  let l = LEVELS[0].name;
  for (const x of LEVELS) if (jobs >= x.min && (jobs === 0 || rating >= x.rating || x.min === 0)) l = x.name;
  return l;
}

// ---------- payments (mock Razorpay behind an interface) ----------
export async function createOrder(opts: { planId: string; userId: string; method: string; useCredits: boolean; useWallet: boolean; promo?: string | null; idempotencyKey: string }) {
  const [existing] = await db.select().from(payments).where(eq(payments.idempotencyKey, opts.idempotencyKey));
  if (existing) return existing;
  const [plan0] = await db.select().from(plans).where(eq(plans.id, opts.planId));
  if (!plan0 || plan0.customerId !== opts.userId) throw new ApiError("not_found", "Plan not found.", 404);
  if (plan0.status === "approved") throw new ApiError("already_paid", "This plan is already paid.");
  if (plan0.status !== "sent") throw new ApiError("not_ready", "This plan is not ready for payment yet.");
  if (opts.promo !== undefined && opts.promo !== plan0.promoCode) await editPlan(opts.planId, { promo: opts.promo });
  const [plan] = await db.select().from(plans).where(eq(plans.id, opts.planId));
  const ts = await db.select().from(tasks).where(eq(tasks.planId, plan.id));
  const holds = ts.reduce((s, t) => s + t.expensesCap, 0);
  const gross = plan.total + holds;
  const [prof] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, opts.userId));
  const credits = opts.useCredits ? Math.min(prof?.creditsBalance ?? 0, gross) : 0;
  const wallet = opts.useWallet ? Math.min(prof?.walletBalance ?? 0, gross - credits) : 0;
  const charge = gross - credits - wallet;
  const [pay] = await db.insert(payments).values({
    planId: plan.id, userId: opts.userId, orderId: "order_" + randomUUID().slice(0, 14), method: opts.method, amount: charge,
    creditsUsed: credits, walletUsed: wallet, idempotencyKey: opts.idempotencyKey,
  }).returning();
  return pay;
}

export async function capturePayment(paymentId: string, providerPaymentId?: string) {
  const [pay] = await db.select().from(payments).where(eq(payments.id, paymentId));
  if (!pay) throw new ApiError("not_found", "Payment not found.", 404);
  if (pay.status === "captured") return pay;
  const [plan] = await db.select().from(plans).where(eq(plans.id, pay.planId));
  const ts = await db.select().from(tasks).where(eq(tasks.planId, plan.id)).orderBy(tasks.scheduledStart);
  const holds = ts.reduce((s, t) => s + t.expensesCap, 0);
  const feeTotal = plan.travelAmount + plan.platformFee + plan.coordinationFee + plan.minTopUp;

  await db.update(payments).set({ status: "captured", paymentId: providerPaymentId ?? "pay_" + randomUUID().slice(0, 14), updatedAt: new Date() }).where(eq(payments.id, pay.id));
  if (pay.creditsUsed || pay.walletUsed) {
    await db.update(customerProfiles).set({
      creditsBalance: sql`${customerProfiles.creditsBalance} - ${pay.creditsUsed}`, walletBalance: sql`${customerProfiles.walletBalance} - ${pay.walletUsed}`,
    }).where(eq(customerProfiles.userId, pay.userId));
  }
  await postJournal([
    { account: "customer_cash", debit: pay.amount, memo: "Customer payment captured" },
    { account: "customer_wallet", debit: pay.walletUsed, memo: "Wallet applied" },
    { account: "promo_cost", debit: pay.creditsUsed + plan.promoDiscount, memo: "Credits and promo applied" },
    { account: "escrow", credit: plan.total + plan.promoDiscount, memo: "Held until approval" },
    { account: "expense_float", credit: holds, memo: "Expense cap hold" },
  ], "payment", pay.id);

  let allocated = 0;
  for (let i = 0; i < ts.length; i++) {
    const t = ts[i];
    const share = i === ts.length - 1 ? feeTotal - allocated : Math.round((feeTotal * t.price) / Math.max(1, plan.subtotal));
    allocated += share;
    await db.update(tasks).set({ feeShare: share, doorOtpHash: sha(doorOtp(t.id)), updatedAt: new Date() }).where(eq(tasks.id, t.id));
    await logEvent(t.id, "paid", pay.userId, "Payment received. Funds held until you approve the work.");
  }
  await db.update(plans).set({ status: "approved", updatedAt: new Date() }).where(eq(plans.id, plan.id));
  await db.update(requests).set({ status: "approved", updatedAt: new Date() }).where(eq(requests.id, plan.requestId));
  await db.update(circleMembers).set({ paymentStatus: "paid" }).where(and(eq(circleMembers.userId, pay.userId), plan.circleId ? eq(circleMembers.circleId, plan.circleId) : sql`false`));
  await notify(pay.userId, "payment_success", "Payment received", "You're all set. We're lining up your helpers now.", `/app/plans/${plan.id}`);
  const flags = await getFlags();
  if (flags.auto_dispatch) for (const t of ts) await dispatchTask(t.id);
  return { ...pay, status: "captured" };
}

// ---------- settlement ----------
async function settleExpense(taskId: string) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!t || !t.expensesCap || t.expense?.status === "settled") return;
  const approved = t.expense && t.expense.status === "approved" ? Math.min(t.expense.approved, t.expensesCap) : 0;
  const refunded = t.expensesCap - approved;
  await postJournal([
    { account: "expense_float", debit: t.expensesCap, memo: "Cap released" },
    { account: "helper_payable", credit: approved, memo: "Receipt reimbursed to helper" },
    { account: "customer_wallet", credit: refunded, memo: "Unused amount refunded to wallet" },
  ], "expense", t.id);
  if (refunded) await db.update(customerProfiles).set({ walletBalance: sql`${customerProfiles.walletBalance} + ${refunded}` }).where(eq(customerProfiles.userId, t.customerId));
  await db.update(tasks).set({ expense: { ...(t.expense ?? { spent: 0, items: [] }), status: "settled", approved, refunded }, updatedAt: new Date() }).where(eq(tasks.id, t.id));
  await notify(t.customerId, "refund_processed", "Unused amount refunded", `₹${Math.round(refunded / 100)} went to your Shell Wallet.`, `/app/wallet`);
}

export async function settleTask(taskId: string, actorId: string | null, auto = false) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!t || t.status !== "awaiting_approval") throw new ApiError("invalid_state", "This job is not waiting for approval.");
  if (!t.checkInAt) throw new ApiError("no_checkin", "A job cannot be approved without a check-in.");
  const cfg = await getPricing();
  const revenue = t.price - t.helperPayout + t.feeShare;
  const tax = Math.round((revenue * cfg.gstPct) / (100 + cfg.gstPct));
  await postJournal([
    { account: "escrow", debit: t.price + t.feeShare, memo: "Released on approval" },
    { account: "helper_payable", credit: t.helperPayout, memo: "Helper earnings" },
    { account: "platform_revenue", credit: revenue - tax, memo: "Commission and fees" },
    { account: "tax_payable", credit: tax, memo: "GST on platform revenue" },
  ], "task", t.id);
  await settleExpense(t.id);
  await db.update(tasks).set({ status: "approved", approvedAt: new Date(), updatedAt: new Date() }).where(eq(tasks.id, t.id));
  await logEvent(t.id, "approved", actorId, auto ? "Auto-approved after the hold window." : "Customer approved the work.");
  if (t.helperId) {
    const [h] = await db.select().from(helperProfiles).where(eq(helperProfiles.userId, t.helperId));
    if (h) {
      const onTime = t.checkInAt && t.scheduledStart && t.checkInAt.getTime() <= t.scheduledStart.getTime() + 15 * 60000 ? 1 : 0;
      const jobs = h.jobsDone + 1;
      await db.update(helperProfiles).set({
        jobsDone: jobs, onTimeRate: (h.onTimeRate * h.jobsDone + onTime) / jobs, level: levelFor(jobs, h.ratingAvg || 5), updatedAt: new Date(),
      }).where(eq(helperProfiles.userId, h.userId));
      await notify(t.helperId, "helper_payout", "Job approved", `₹${Math.round(t.helperPayout / 100)} added to your earnings.`, "/helper/earnings");
    }
  }
  await notify(t.customerId, "job_done", "Home ready", "Your job is complete. Take a moment to leave a review.", `/app/orders/${t.id}`);
}

export async function autoApproveDue() {
  const cfg = await getPricing();
  const cutoff = new Date(Date.now() - cfg.holdHours * 3600000);
  const due = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.status, "awaiting_approval"), lt(tasks.checkOutAt, cutoff)));
  for (const d of due) await settleTask(d.id, null, true).catch(() => {});
}

// ---------- refunds / cancellation ----------
async function cancelTask(t: typeof tasks.$inferSelect, actor: Actor, reason: string) {
  const early = ["planned", "offered", "accepted"].includes(t.status);
  if (!["planned", "offered", "accepted", "en_route", "arrived"].includes(t.status)) throw new ApiError("invalid_state", "This job can no longer be cancelled.");
  const paid = t.feeShare > 0 || (await db.select().from(plans).where(and(eq(plans.id, t.planId), eq(plans.status, "approved")))).length > 0;
  if (paid) {
    const gross = t.price + t.feeShare;
    const refund = early ? gross : Math.round(gross * 0.8);
    await postJournal([
      { account: "escrow", debit: gross, memo: `Cancelled: ${reason}` },
      { account: "customer_cash", credit: refund, memo: "Refund to original payment method" },
      { account: "platform_revenue", credit: gross - refund, memo: "Late cancellation fee" },
    ], "refund", t.id);
    if (t.expensesCap) await db.update(customerProfiles).set({ walletBalance: sql`${customerProfiles.walletBalance} + ${t.expensesCap}` }).where(eq(customerProfiles.userId, t.customerId));
    await notify(t.customerId, "refund_processed", "Refund on the way", `₹${Math.round(refund / 100)} will return to your payment method.`, `/app/orders/${t.id}`);
  }
  await db.update(offers).set({ status: "expired", respondedAt: new Date() }).where(and(eq(offers.taskId, t.id), eq(offers.status, "sent")));
  await db.update(tasks).set({ status: "cancelled", updatedAt: new Date() }).where(eq(tasks.id, t.id));
  await logEvent(t.id, "cancelled", actor.id, reason);
}

// ---------- the state machine ----------
export async function act(taskId: string, action: string, actor: Actor, p: any = {}) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!t) throw new ApiError("not_found", "Job not found.", 404);
  const isCustomer = actor.id === t.customerId;
  const isHelper = actor.id === t.helperId;
  const isOps = actor.role === "OPS" || actor.role === "SUPER_ADMIN";
  const need = (ok: boolean) => { if (!ok) throw new ApiError("forbidden", "You cannot do this on this job.", 403); };
  const state = (...s: string[]) => { if (!s.includes(t.status)) throw new ApiError("invalid_state", `This can't be done while the job is "${t.status.replace("_", " ")}".`); };
  const [helperUser] = t.helperId ? await db.select().from(users).where(eq(users.id, t.helperId)) : [];
  const first = (n?: string) => (n ?? "Your helper").split(" ")[0];

  switch (action) {
    case "accept": {
      need(actor.role === "HELPER"); state("offered", "planned");
      const [offer] = await db.select().from(offers).where(and(eq(offers.taskId, t.id), eq(offers.helperId, actor.id), eq(offers.status, "sent")));
      if (!offer) throw new ApiError("no_offer", "This offer is no longer available.");
      const res = await db.update(tasks).set({ helperId: actor.id, status: "accepted", updatedAt: new Date() }).where(and(eq(tasks.id, t.id), sql`${tasks.helperId} is null`)).returning({ id: tasks.id });
      if (!res.length) throw new ApiError("taken", "Another helper just accepted this job.");
      await db.update(offers).set({ status: "accepted", respondedAt: new Date() }).where(eq(offers.id, offer.id));
      await db.update(offers).set({ status: "expired", respondedAt: new Date() }).where(and(eq(offers.taskId, t.id), eq(offers.status, "sent")));
      const [me] = await db.select().from(users).where(eq(users.id, actor.id));
      await logEvent(t.id, "accepted", actor.id, `${first(me?.name)} accepted the job.`);
      await notify(t.customerId, "helper_assigned", "Helper assigned", `${first(me?.name)} will do ${t.title}. Open the order to see their profile.`, `/app/orders/${t.id}`);
      return { ok: true };
    }
    case "decline": {
      need(actor.role === "HELPER");
      await db.update(offers).set({ status: "declined", reason: p.reason ?? null, respondedAt: new Date() }).where(and(eq(offers.taskId, t.id), eq(offers.helperId, actor.id), eq(offers.status, "sent")));
      const open = await db.select().from(offers).where(and(eq(offers.taskId, t.id), eq(offers.status, "sent")));
      if (!open.length && !t.helperId) await dispatchTask(t.id);
      return { ok: true };
    }
    case "enroute": {
      need(isHelper); state("accepted", "rework");
      await db.update(tasks).set({ status: "en_route", enRouteAt: new Date(), updatedAt: new Date() }).where(eq(tasks.id, t.id));
      await logEvent(t.id, "en_route", actor.id, `${first(helperUser?.name)} is on the way.`);
      await notify(t.customerId, "helper_on_the_way", "Helper on the way", `${first(helperUser?.name)} is heading to your tower. Door code: ${doorOtp(t.id)}. Share it only with them at your door.`, `/app/orders/${t.id}`);
      return { ok: true };
    }
    case "checkin": {
      need(isHelper); state("accepted", "en_route", "arrived");
      const flags = await getFlags();
      if (flags.geofence_enforced || (p.lat && p.lng && p.enforce)) {
        const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId));
        const [rq] = await db.select().from(requests).where(eq(requests.id, plan.requestId));
        const [ad] = rq?.addressId ? await db.select().from(addresses).where(eq(addresses.id, rq.addressId)) : [];
        if (ad) {
          if (typeof p.lat !== "number" || typeof p.lng !== "number") throw new ApiError("location_required", "Turn on location to check in. Tracking only runs during an active job.");
          const d = haversine({ lat: p.lat, lng: p.lng }, { lat: ad.lat, lng: ad.lng });
          if (d > GEOFENCE_M) throw new ApiError("too_far", `You are about ${Math.round(d)} m away. Check-in works within ${GEOFENCE_M} m of the address.`);
        }
      }
      const failed = (await db.select({ id: taskEvents.id }).from(taskEvents).where(and(eq(taskEvents.taskId, t.id), eq(taskEvents.type, "otp_failed")))).length;
      if (String(p.otp ?? "") !== doorOtp(t.id)) {
        await logEvent(t.id, "otp_failed", actor.id, "Wrong door code entered.");
        if (failed + 1 >= 3) await notifyOps("otp_failed", "Door code failed 3 times", `${t.title}: helper could not check in.`, `/ops/jobs/${t.id}`);
        throw new ApiError("bad_otp", "That door code isn't right. Ask the customer to read it from their app.");
      }
      await db.update(tasks).set({ status: "in_progress", checkInAt: new Date(), updatedAt: new Date() }).where(eq(tasks.id, t.id));
      await logEvent(t.id, "arrived", actor.id, "Arrived and verified with the door code.");
      await logEvent(t.id, "started", actor.id, "Job started.");
      await notify(t.customerId, "job_started", "Job started", `${first(helperUser?.name)} has started ${t.title}.`, `/app/orders/${t.id}`);
      return { ok: true };
    }
    case "checklist": {
      need(isHelper); state("in_progress");
      const list = t.checklist.map((c, i) => (i === p.index ? { ...c, done: !!p.done } : c));
      await db.update(tasks).set({ checklist: list, updatedAt: new Date() }).where(eq(tasks.id, t.id));
      return { ok: true };
    }
    case "photo": {
      need(isHelper); state("in_progress", "arrived");
      const url = String(p.url ?? "");
      if (!url.startsWith("data:image/") || url.length > 700000) throw new ApiError("bad_photo", "Photo is too large. Try again with a smaller one.");
      const col = p.kind === "before" ? "beforePhotos" : "afterPhotos";
      await db.update(tasks).set({ [col]: [...(p.kind === "before" ? t.beforePhotos : t.afterPhotos), url].slice(-4), updatedAt: new Date() }).where(eq(tasks.id, t.id));
      await logEvent(t.id, "photo", actor.id, `${p.kind} photo added`);
      return { ok: true };
    }
    case "checkout": {
      need(isHelper); state("in_progress");
      if (t.checklist.some((c) => !c.done) && !p.partial) throw new ApiError("checklist_open", "Finish the checklist first, or mark the job as partially done.");
      await db.update(tasks).set({ status: "awaiting_approval", checkOutAt: new Date(), notes: p.summary ? `${t.notes}\nHelper summary: ${p.summary}`.trim() : t.notes, updatedAt: new Date() }).where(eq(tasks.id, t.id));
      await logEvent(t.id, "checkout", actor.id, p.partial ? "Checked out (partially done)." : "Work finished. Waiting for customer approval.");
      await notify(t.customerId, "job_done_review", "Please review the work", "Check the photos and checklist, then approve.", `/app/orders/${t.id}`);
      return { ok: true };
    }
    case "approve": {
      need(isCustomer || isOps);
      await settleTask(t.id, actor.id);
      return { ok: true };
    }
    case "rework": {
      need(isCustomer || isOps); state("awaiting_approval", "approved");
      if (t.reworkCount >= 1) throw new ApiError("rework_used", "Rework was already used on this job. Please open a dispute.");
      if (t.status === "approved" && t.approvedAt && Date.now() - t.approvedAt.getTime() > 24 * 3600000) throw new ApiError("too_late", "Rework must be requested within 24 hours.");
      if (t.status === "approved") throw new ApiError("already_paid_out", "This job was already approved. Please open a dispute if something is wrong.");
      const items = Array.isArray(p.items) ? (p.items as number[]) : [];
      const list = t.checklist.map((c, i) => (items.includes(i) ? { ...c, done: false } : c));
      await db.update(tasks).set({ status: "rework", reworkCount: t.reworkCount + 1, checklist: list, notes: `${t.notes}\nRework: ${p.note ?? ""}`.trim(), updatedAt: new Date() }).where(eq(tasks.id, t.id));
      await logEvent(t.id, "rework", actor.id, p.note ? `Rework requested: ${p.note}` : "Rework requested.");
      if (t.helperId) await notify(t.helperId, "rework", "Rework requested", p.note ?? "The customer asked for a few fixes.", `/helper/jobs/${t.id}`);
      return { ok: true };
    }
    case "restart": {
      need(isHelper); state("rework");
      await db.update(tasks).set({ status: "in_progress", updatedAt: new Date() }).where(eq(tasks.id, t.id));
      await logEvent(t.id, "started", actor.id, "Rework started.");
      return { ok: true };
    }
    case "cancel": {
      need(isCustomer || isOps || isHelper);
      if (isHelper && !isOps) {
        state("accepted", "en_route");
        await db.update(tasks).set({ helperId: null, status: "offered", updatedAt: new Date() }).where(eq(tasks.id, t.id));
        await logEvent(t.id, "helper_cancelled", actor.id, "Helper cancelled. Finding a replacement.");
        await notify(t.customerId, "helper_changed", "We're finding a new helper", "Your previous helper had to cancel. No charge to you, and we're prioritising a replacement.", `/app/orders/${t.id}`);
        await dispatchTask(t.id, { exclude: [actor.id], priority: true });
        return { ok: true };
      }
      await cancelTask(t, actor, p.reason ?? "Cancelled by customer");
      return { ok: true };
    }
    case "request_change": {
      need(isHelper); state("in_progress");
      const minutes = Math.max(15, Math.min(240, Number(p.minutes) || 30));
      const perMin = t.price / Math.max(30, t.durationEstMin);
      const change: ChangeReq = { id: randomUUID(), type: p.type === "extra_task" ? "extra_task" : "extra_time", minutes, delta: rupee(perMin * minutes), note: String(p.note ?? "").slice(0, 300), status: "pending", by: actor.id };
      await db.update(tasks).set({ changes: [...t.changes, change], updatedAt: new Date() }).where(eq(tasks.id, t.id));
      await logEvent(t.id, "change_requested", actor.id, `${change.type === "extra_time" ? `${minutes} min extra` : "Extra task"}: ${change.note || "no note"} (₹${Math.round(change.delta / 100)})`);
      await notify(t.customerId, "change_requested", "Change request", `Extra ${minutes} min for ₹${Math.round(change.delta / 100)}. Accept or decline in your order.`, `/app/orders/${t.id}`);
      return { ok: true };
    }
    case "respond_change": {
      need(isCustomer);
      const ch = t.changes.find((c) => c.id === p.changeId && c.status === "pending");
      if (!ch) throw new ApiError("not_found", "Change request not found.", 404);
      const accept = !!p.accept;
      const changes = t.changes.map((c) => (c.id === ch.id ? { ...c, status: accept ? ("accepted" as const) : ("declined" as const) } : c));
      if (accept) {
        const payout = rupee(ch.delta * 0.8);
        await db.update(tasks).set({ changes, price: t.price + ch.delta, helperPayout: t.helperPayout + payout, durationEstMin: t.durationEstMin + ch.minutes, updatedAt: new Date() }).where(eq(tasks.id, t.id));
        await db.update(plans).set({ subtotal: sql`${plans.subtotal} + ${ch.delta}`, total: sql`${plans.total} + ${ch.delta}`, updatedAt: new Date() }).where(eq(plans.id, t.planId));
        await postJournal([{ account: "customer_cash", debit: ch.delta, memo: "Approved change request" }, { account: "escrow", credit: ch.delta, memo: "Held until approval" }], "change", t.id);
      } else await db.update(tasks).set({ changes, updatedAt: new Date() }).where(eq(tasks.id, t.id));
      await logEvent(t.id, accept ? "change_accepted" : "change_declined", actor.id, `Change request ${accept ? "accepted" : "declined"}.`);
      if (t.helperId) await notify(t.helperId, "change", `Change ${accept ? "accepted" : "declined"}`, ch.note || "Extra time request", `/helper/jobs/${t.id}`);
      return { ok: true };
    }
    case "expense": {
      need(isHelper); state("in_progress");
      const items: { name: string; amount: number }[] = (p.items ?? []).map((i: any) => ({ name: String(i.name).slice(0, 60), amount: Math.max(0, Math.round(Number(i.amount) * 100)) }));
      const spent = items.reduce((s, i) => s + i.amount, 0);
      if (!t.expensesCap) throw new ApiError("no_cap", "This job has no expense cap.");
      if (spent > t.expensesCap) throw new ApiError("over_cap", "That is above the customer's cap. Send a change request instead.");
      await db.update(tasks).set({ expense: { spent, items, status: "pending_approval", approved: 0, refunded: 0, receipt: p.receipt }, updatedAt: new Date() }).where(eq(tasks.id, t.id));
      await logEvent(t.id, "expense_uploaded", actor.id, `Receipt uploaded: ₹${Math.round(spent / 100)}`);
      await notify(t.customerId, "receipt_to_approve", "Receipt to approve", `₹${Math.round(spent / 100)} spent of your ₹${Math.round(t.expensesCap / 100)} cap.`, `/app/orders/${t.id}`);
      return { ok: true };
    }
    case "expense_approve": {
      need(isCustomer); if (!t.expense || t.expense.status !== "pending_approval") throw new ApiError("invalid_state", "No receipt is waiting for approval.");
      const rejected: number[] = p.rejected ?? [];
      const approved = t.expense.items.reduce((s, it, i) => s + (rejected.includes(i) ? 0 : it.amount), 0);
      await db.update(tasks).set({ expense: { ...t.expense, status: "approved", approved }, updatedAt: new Date() }).where(eq(tasks.id, t.id));
      await logEvent(t.id, "expense_approved", actor.id, `Expenses approved: ₹${Math.round(approved / 100)}`);
      return { ok: true };
    }
    case "review": {
      need(isCustomer); state("approved");
      if (!t.helperId) throw new ApiError("no_helper", "No helper to review.");
      const [dup] = await db.select().from(reviews).where(and(eq(reviews.taskId, t.id), eq(reviews.fromUserId, actor.id)));
      if (dup) throw new ApiError("duplicate", "You already reviewed this job.");
      const rating = Math.max(1, Math.min(5, Number(p.rating) || 5));
      const tip = Math.max(0, Math.min(200000, Math.round(Number(p.tip || 0) * 100)));
      await db.insert(reviews).values({ taskId: t.id, fromUserId: actor.id, toUserId: t.helperId, rating, tags: (p.tags ?? []).slice(0, 5), note: String(p.note ?? "").slice(0, 400), tip });
      if (tip) await postJournal([{ account: "customer_cash", debit: tip, memo: "Tip" }, { account: "helper_payable", credit: tip, memo: "Tip, 100% to helper" }], "tip", t.id);
      if (p.shellNote) await db.insert(shellNotes).values({ taskId: t.id, fromUserId: actor.id, toUserId: t.helperId, body: String(p.shellNote).slice(0, 200) });
      const [agg] = await db.select({ avg: sql<number>`avg(${reviews.rating})::float`, n: sql<number>`count(*)::int` }).from(reviews).where(eq(reviews.toUserId, t.helperId));
      await db.update(helperProfiles).set({ ratingAvg: agg.avg, ratingCount: agg.n }).where(eq(helperProfiles.userId, t.helperId));
      await notify(t.helperId, "review", `You got ${rating} stars`, tip ? `Plus a ₹${Math.round(tip / 100)} tip.` : "", "/helper/passport");
      return { ok: true };
    }
    case "sos": {
      need(isCustomer || isHelper);
      const when = new Date().toISOString();
      const [s] = await db.insert(sosEvents).values({ taskId: t.id, userId: actor.id, kind: p.silent ? "silent" : "loud", timeline: [
        { at: when, text: "SOS triggered" }, { at: when, text: "Live location shared with Shell Ops and trusted contact" }, { at: when, text: "Society guard alerted" },
      ] }).returning();
      await notifyOps("sos", "SOS raised", `${t.title}. Respond within 20 seconds.`, "/ops/safety");
      await logEvent(t.id, "sos", actor.id, "SOS raised.");
      return { ok: true, id: s.id };
    }
    default:
      throw new ApiError("unknown_action", "Unknown action.");
  }
}

/** Demo helper: performs the next step on behalf of the helper so one person can try the whole flow. */
export async function demoAdvance(taskId: string) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!t) throw new ApiError("not_found", "Job not found.", 404);
  if (!["planned", "offered"].includes(t.status) && !t.helperId) throw new ApiError("invalid_state", "Nothing to advance.");
  if (!t.helperId) {
    let [offer] = await db.select().from(offers).where(and(eq(offers.taskId, t.id), eq(offers.status, "sent")));
    if (!offer) { await dispatchTask(t.id); [offer] = await db.select().from(offers).where(and(eq(offers.taskId, t.id), eq(offers.status, "sent"))); }
    if (!offer) throw new ApiError("no_helper", "No helper is available for this task right now.");
    return act(t.id, "accept", { id: offer.helperId, role: "HELPER" });
  }
  const h = { id: t.helperId, role: "HELPER" };
  switch (t.status) {
    case "accepted": return act(t.id, "enroute", h);
    case "rework": return act(t.id, "restart", h);
    case "en_route": return act(t.id, "checkin", h, { otp: doorOtp(t.id) });
    case "in_progress": {
      if (t.expensesCap && !t.expense) return act(t.id, "expense", h, { items: [{ name: "Groceries", amount: Math.round(t.expensesCap / 100 * 0.82) }] });
      if (t.checklist.some((c) => !c.done)) {
        for (let i = 0; i < t.checklist.length; i++) await act(t.id, "checklist", h, { index: i, done: true });
        return { ok: true };
      }
      return act(t.id, "checkout", h, { summary: "All done as per checklist." });
    }
    default: throw new ApiError("invalid_state", "Waiting for the customer.");
  }
}

export async function instantPayout(helperId: string) {
  const rows = await db.select().from(tasks).where(and(eq(tasks.helperId, helperId), eq(tasks.status, "approved"), eq(tasks.paidOut, false)));
  if (!rows.length) throw new ApiError("nothing", "There is nothing to pay out yet.");
  const tips = await db.select({ tip: sql<number>`coalesce(sum(${reviews.tip}),0)::int` }).from(reviews).where(and(eq(reviews.toUserId, helperId), inArray(reviews.taskId, rows.map((r) => r.id))));
  const gross = rows.reduce((s, r) => s + r.helperPayout + (r.expense?.approved ?? 0), 0) + tips[0].tip;
  const fee = Math.max(500, Math.round(gross * 0.02));
  await postJournal([
    { account: "helper_payable", debit: gross, memo: "Instant payout" },
    { account: "bank", credit: gross - fee, memo: "Sent to helper" },
    { account: "platform_revenue", credit: fee, memo: "Instant payout fee" },
  ], "payout", helperId);
  await db.insert(payouts).values({ helperId, amount: gross - fee, fee, method: "instant", status: "paid", utr: "UTR" + Date.now(), taskIds: rows.map((r) => r.id) });
  await db.update(tasks).set({ paidOut: true }).where(inArray(tasks.id, rows.map((r) => r.id)));
  await notify(helperId, "helper_payout_sent", "Payout sent", `₹${Math.round((gross - fee) / 100)} is on its way to your account.`, "/helper/earnings");
  return { amount: gross - fee, fee };
}

export { candidatesFor, desc, towers, categories, circles };
