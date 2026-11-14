import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { addresses, expenses, fraudAlerts, helpers, kudos, photos, plans, reviews, shellNotes, sosEvents, taskEvents, tasks, taskTemplates, trustedContacts, users, customerProfiles, societies } from "@/db/schema";
import { AppError, api, body, need } from "@/lib/api";
import { audit } from "@/lib/audit";
import { haversine } from "@/lib/geo";
import { logEvent, repricePlan } from "@/lib/plans";
import { postJournal, recordRefund, releaseTaskPayment } from "@/lib/money";
import { checkDoorOtp } from "@/lib/otp";
import { notify } from "@/lib/notify";
import { taskGuard } from "@/lib/statemachine";
import { doorOtp } from "@/lib/otp";
import type { SessionUser } from "@/lib/auth";

async function context(taskId: string, user: SessionUser) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  need(t, "Task");
  const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId)).limit(1);
  const [helper] = await db.select().from(helpers).where(eq(helpers.userId, user.id)).limit(1);
  const isCustomer = plan.customerId === user.id;
  const isHelper = !!helper && t.assignedHelperId === helper.id;
  const isOps = user.role === "OPS" || user.role === "SUPER_ADMIN";
  if (!isCustomer && !isHelper && !isOps) throw new AppError(403, "forbidden", "This is not your task.", "यह आपका काम नहीं है।");
  return { t, plan, helper, isCustomer, isHelper, isOps };
}
const mustBe = (ok: boolean, who: string) => { if (!ok) throw new AppError(403, "forbidden", `Only the ${who} can do this.`); };
const GEOFENCE_M = 150;

export const POST = api<{ id: string; action: string }>(async ({ req, params, user }) => {
  const { t, plan, helper, isCustomer, isHelper, isOps } = await context(params.id, user!);
  const [addr] = plan.addressId ? await db.select().from(addresses).where(eq(addresses.id, plan.addressId)).limit(1) : [];
  const set = (v: Partial<typeof tasks.$inferInsert>) => db.update(tasks).set({ ...v, updatedAt: new Date() }).where(eq(tasks.id, t.id));

  switch (params.action) {
    case "enroute": {
      mustBe(isHelper, "assigned helper");
      const g = taskGuard(t.status, "en_route");
      if (g) throw new AppError(409, "bad_transition", g);
      await set({ status: "en_route" });
      await logEvent(t.id, plan.id, "en_route", {}, user!.id);
      await notify(plan.customerId, "helper_on_the_way_5", { helper: helper!.displayName.split(" ")[0], tower: "your tower", eta: 6, otp: doorOtp(t.id) });
      return { ok: true };
    }
    case "checkin": {
      mustBe(isHelper, "assigned helper");
      const b = await body(req, z.object({ lat: z.number(), lng: z.number(), otp: z.string().length(4), accuracy: z.number().optional(), mock: z.boolean().optional(), selfie: z.string().max(400000).optional() }));
      if (!["accepted", "en_route", "arrived"].includes(t.status)) throw new AppError(409, "bad_state", "This job cannot be checked in right now.");
      if (b.mock) {
        await db.insert(fraudAlerts).values({ type: "gps_mock", severity: "high", refType: "task", refId: t.id, evidence: { helper: helper!.displayName, note: "Mock location flag at check-in" } });
        throw new AppError(403, "mock_location", "Mock location detected. Turn it off to check in.", "मॉक लोकेशन मिली। इसे बंद कीजिए।");
      }
      const target = addr?.lat != null ? { lat: addr.lat, lng: addr.lng! } : null;
      const dist = target ? haversine({ lat: b.lat, lng: b.lng }, target) : 0;
      if (target && dist > GEOFENCE_M) {
        await db.insert(fraudAlerts).values({ type: "far_checkin", severity: "medium", refType: "task", refId: t.id, evidence: { distanceM: Math.round(dist) } });
        throw new AppError(403, "too_far", `You are about ${Math.round(dist)} m away. Get within ${GEOFENCE_M} m of the address to check in.`, "पते के 150 मीटर के अंदर आइए।");
      }
      if (!checkDoorOtp(t.id, b.otp)) {
        const fails = t.otpFailures + 1;
        await set({ otpFailures: fails });
        if (fails >= 3) await db.insert(fraudAlerts).values({ type: "otp_failures", severity: "high", refType: "task", refId: t.id, evidence: { fails, helper: helper!.displayName } });
        throw new AppError(400, "bad_otp", fails >= 3 ? "Wrong OTP three times. Ops has been alerted." : "That door OTP is not right.", "Door OTP सही नहीं है।");
      }
      const arrived = taskGuard(t.status === "arrived" ? "arrived" : "en_route", "arrived", { geofenceOk: true });
      void arrived;
      const now = new Date();
      const g = taskGuard("arrived", "in_progress", { otpOk: true, checkinAt: now });
      if (g) throw new AppError(409, "guard", g);
      await set({ status: "in_progress", checkinAt: now });
      if (b.selfie) await db.insert(photos).values({ ownerId: user!.id, taskId: t.id, kind: "selfie", url: b.selfie, lat: b.lat, lng: b.lng });
      await logEvent(t.id, plan.id, "checked_in", { distanceM: Math.round(dist), otp: true }, user!.id);
      await notify(plan.customerId, "job_started", { task: t.name });
      return { ok: true, distanceM: Math.round(dist) };
    }
    case "checklist": {
      mustBe(isHelper, "assigned helper");
      const b = await body(req, z.object({ index: z.number().int().min(0), done: z.boolean() }));
      const list = t.checklist.map((c, i) => (i === b.index ? { ...c, done: b.done, ts: b.done ? new Date().toISOString() : undefined } : c));
      await set({ checklist: list });
      return { ok: true, checklist: list };
    }
    case "photo": {
      mustBe(isHelper || isCustomer, "customer or helper");
      const b = await body(req, z.object({ kind: z.enum(["before", "after", "receipt", "checklist"]), url: z.string().max(400000), lat: z.number().optional(), lng: z.number().optional() }));
      const [p] = await db.insert(photos).values({ ownerId: user!.id, taskId: t.id, kind: b.kind, url: b.url, lat: b.lat, lng: b.lng }).returning({ id: photos.id });
      return { ok: true, id: p.id };
    }
    case "checkout": {
      mustBe(isHelper, "assigned helper");
      const b = await body(req, z.object({ partial: z.boolean().default(false), note: z.string().max(300).optional() }));
      if (t.status !== "in_progress") throw new AppError(409, "bad_state", "Only a job in progress can be checked out.");
      if (!b.partial && t.checklist.some((c) => !c.done)) throw new AppError(400, "checklist_incomplete", "Finish the checklist or mark the job as partial.", "चेकलिस्ट पूरी कीजिए।");
      await set({ status: "awaiting_approval", checkoutAt: new Date() });
      await logEvent(t.id, plan.id, "checked_out", { partial: b.partial, note: b.note }, user!.id);
      await notify(plan.customerId, "job_done_review", { task: t.name });
      return { ok: true, autoApproveAt: new Date(Date.now() + 2 * 3600000).toISOString() };
    }
    case "approve": {
      mustBe(isCustomer || isOps, "customer");
      const g = taskGuard(t.status, "approved");
      if (g) throw new AppError(409, "bad_transition", g);
      await set({ status: "approved", approvedAt: new Date() });
      await releaseTaskPayment(t.id);
      await logEvent(t.id, plan.id, "approved", {}, user!.id);
      await db.update(customerProfiles).set({ streak: sql`${customerProfiles.streak} + 1` }).where(eq(customerProfiles.userId, plan.customerId));
      return { ok: true };
    }
    case "rework": {
      mustBe(isCustomer, "customer");
      const b = await body(req, z.object({ items: z.array(z.number().int()).default([]), note: z.string().max(400).optional() }));
      const g = taskGuard(t.status, "rework", { reworkCount: t.reworkCount, approvedWithin24h: !t.checkoutAt || Date.now() - t.checkoutAt.getTime() < 24 * 3600000 });
      if (g) throw new AppError(409, "bad_transition", g);
      await set({ status: "in_progress", reworkCount: t.reworkCount + 1, reworkUntil: new Date(Date.now() + 24 * 3600000), checklist: t.checklist.map((c, i) => (b.items.includes(i) ? { ...c, done: false } : c)) });
      await logEvent(t.id, plan.id, "rework_requested", { items: b.items, note: b.note }, user!.id);
      await notify(plan.customerId, "rework_scheduled", {});
      return { ok: true };
    }
    case "review": {
      mustBe(isCustomer, "customer");
      const b = await body(req, z.object({ rating: z.number().int().min(1).max(5), tags: z.array(z.string().max(30)).max(6).default([]), note: z.string().max(400).optional(), tip: z.number().int().min(0).max(500000).default(0), shellNote: z.string().max(140).optional() }));
      if (!t.assignedHelperId) throw new AppError(409, "no_helper", "No helper on this task.");
      const [h] = await db.select().from(helpers).where(eq(helpers.id, t.assignedHelperId)).limit(1);
      const dup = await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.taskId, t.id), eq(reviews.fromUserId, user!.id))).limit(1);
      if (dup.length) throw new AppError(409, "already_reviewed", "You already reviewed this job.");
      await db.insert(reviews).values({ taskId: t.id, fromUserId: user!.id, toUserId: h.userId, rating: b.rating, tags: b.tags, note: b.note ?? "", tipAmount: b.tip });
      const n = h.ratingCount + 1;
      await db.update(helpers).set({ ratingCount: n, ratingAvg: Number(((h.ratingAvg * h.ratingCount + b.rating) / n).toFixed(2)) }).where(eq(helpers.id, h.id));
      if (b.tip) await postJournal([{ account: "customer_cash", debit: b.tip, credit: 0, memo: "Tip (100% to helper)" }, { account: "helper_payable", debit: 0, credit: b.tip, memo: "Tip" }], "tip", t.id);
      if (b.shellNote) await db.insert(shellNotes).values({ fromUserId: user!.id, toUserId: h.userId, taskId: t.id, body: b.shellNote });
      if (b.rating >= 4) await db.insert(kudos).values({ fromUserId: user!.id, toHelperId: h.id, taskId: t.id });
      return { ok: true };
    }
    case "expense": {
      mustBe(isHelper, "assigned helper");
      const b = await body(req, z.object({ receiptUrl: z.string().max(400000), items: z.array(z.object({ name: z.string().max(80), amount: z.number().int().min(0) })).min(1).max(60) }));
      const spent = b.items.reduce((s, i) => s + i.amount, 0);
      if (t.expensesCap && spent > t.expensesCap) throw new AppError(400, "over_cap", "That is over the spending cap. Message the customer first.", "यह सीमा से ज़्यादा है।");
      const [ph] = await db.insert(photos).values({ ownerId: user!.id, taskId: t.id, kind: "receipt", url: b.receiptUrl }).returning({ id: photos.id });
      const [ex] = await db.select().from(expenses).where(eq(expenses.taskId, t.id)).limit(1);
      if (ex) await db.update(expenses).set({ spent, ocrItems: b.items, status: "receipt_uploaded", receiptPhotoId: ph.id }).where(eq(expenses.id, ex.id));
      else await db.insert(expenses).values({ taskId: t.id, cap: t.expensesCap || spent, spent, ocrItems: b.items, status: "receipt_uploaded", receiptPhotoId: ph.id });
      await notify(plan.customerId, "receipt_to_approve", { spent: Math.round(spent / 100), cap: Math.round((t.expensesCap || spent) / 100) });
      return { ok: true, spent };
    }
    case "expense_approve": {
      mustBe(isCustomer, "customer");
      const b = await body(req, z.object({ rejected: z.array(z.number().int()).default([]) }));
      const [ex] = await db.select().from(expenses).where(eq(expenses.taskId, t.id)).limit(1);
      need(ex, "Expense");
      const items = ex.ocrItems.map((i, idx) => ({ ...i, rejected: b.rejected.includes(idx) }));
      const approved = items.filter((i) => !i.rejected).reduce((s, i) => s + i.amount, 0);
      const refund = Math.max(0, ex.cap - approved);
      await db.update(expenses).set({ ocrItems: items, approvedAmount: approved, refundedAmount: refund, status: "approved" }).where(eq(expenses.id, ex.id));
      if (refund) await recordRefund("expense", ex.id, refund, true);
      await notify(plan.customerId, "refund_processed", { amount: Math.round(refund / 100), method: "your original method" });
      return { ok: true, approved, refund };
    }
    case "change": {
      mustBe(isHelper || isCustomer, "customer or helper");
      const b = await body(req, z.object({ kind: z.enum(["extra_time", "extra_task"]), minutes: z.number().int().min(15).max(240).default(60), note: z.string().max(200).optional() }));
      const [tpl] = await db.select().from(taskTemplates).where(eq(taskTemplates.slug, t.templateSlug)).limit(1);
      const delta = Math.round(((tpl?.baseRate ?? 20000) / (tpl?.minutesPerUnit ?? 60)) * b.minutes / 100) * 100;
      await logEvent(t.id, plan.id, "change_requested", { ...b, delta, status: "pending", by: isHelper ? "helper" : "customer" }, user!.id);
      await notify(plan.customerId, "change_requested", { helper: helper?.displayName ?? "Shell", change: b.kind === "extra_time" ? `${b.minutes} more minutes` : "an extra task", delta: Math.round(delta / 100) });
      return { ok: true, delta };
    }
    case "change_respond": {
      mustBe(isCustomer, "customer");
      const b = await body(req, z.object({ eventId: z.string().uuid(), accept: z.boolean() }));
      const [ev] = await db.select().from(taskEvents).where(and(eq(taskEvents.id, b.eventId), eq(taskEvents.taskId, t.id))).limit(1);
      need(ev, "Change request");
      const d = ev.detail as { status?: string; kind?: string; minutes?: number };
      if (d.status !== "pending") throw new AppError(409, "already_answered", "Already answered.");
      await db.update(taskEvents).set({ detail: { ...d, status: b.accept ? "accepted" : "declined" } }).where(eq(taskEvents.id, ev.id));
      if (b.accept) {
        const [tpl] = await db.select().from(taskTemplates).where(eq(taskTemplates.slug, t.templateSlug)).limit(1);
        if (d.kind === "extra_time" && tpl?.unit === "hour") await set({ quantity: t.quantity + Math.max(1, Math.round((d.minutes ?? 60) / 60)) });
        else await db.insert(tasks).values({ planId: plan.id, templateSlug: t.templateSlug, name: t.name + " (extra)", quantity: 1, size: t.size, sequence: 99, assignedHelperId: t.assignedHelperId, status: "accepted", checklist: t.checklist.map((c) => ({ label: c.label, done: false })), scheduledStart: t.scheduledStart, scheduledEnd: t.scheduledEnd });
        await repricePlan(plan.id);
      }
      return { ok: true };
    }
    case "sos": {
      mustBe(isHelper || isCustomer, "customer or helper");
      const b = await body(req, z.object({ kind: z.enum(["loud", "silent"]).default("loud"), lat: z.number().optional(), lng: z.number().optional() }));
      const now = new Date().toISOString();
      const [s] = await db.insert(sosEvents).values({ taskId: t.id, userId: user!.id, kind: b.kind, points: b.lat != null ? [{ lat: b.lat, lng: b.lng!, ts: now }] : [], timeline: [{ ts: now, text: `${b.kind === "silent" ? "Silent " : ""}SOS raised by ${isHelper ? "helper" : "customer"}` }, { ts: now, text: "Ops alerted, guard informed, trusted contact messaged (20 second target)" }] }).returning({ id: sosEvents.id });
      const tc = await db.select().from(trustedContacts).where(eq(trustedContacts.userId, user!.id));
      await audit({ actorId: user!.id, action: "sos", entity: "task", entityId: t.id, after: { sos: s.id, trustedContacts: tc.length }, req });
      await notify(user!.id, "sos_sent", {});
      return { ok: true, id: s.id, notified: { ops: true, guard: true, trustedContacts: tc.length } };
    }
    default:
      throw new AppError(404, "not_found", "Unknown action");
  }
}, { roles: ["CUSTOMER", "HELPER", "OPS"], limit: { key: "taskact", max: 120, windowMs: 60000 } });

void users; void societies;
