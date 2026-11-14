import { route, ApiError } from "@/lib/api";
import { db } from "@/db";
import * as S from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { audit, getPricing, setSetting, getFlags } from "@/lib/settings";
import { writePlan, planWithTasks } from "@/lib/plans";
import { sendPlan } from "@/lib/requests";
import { dispatchTask } from "@/lib/dispatch";
import { notify } from "@/lib/notify";
import { logEvent, postJournal } from "@/lib/tasks";
import type { Urgency } from "@/lib/pricing";

export const POST = route({ roles: ["OPS", "SUPER_ADMIN"], limit: [120, 60000] }, async ({ body, user, ip }) => {
  const need = (s: unknown, m = "Please give a short reason.") => { if (!String(s ?? "").trim()) throw new ApiError("reason_required", m); return String(s).trim().slice(0, 300); };
  const a = String(body.action);
  switch (a) {
    case "plan_rebuild": {
      const d = await planWithTasks(body.planId); if (!d) throw new ApiError("not_found", "Plan not found.", 404);
      const [req] = await db.select().from(S.requests).where(eq(S.requests.id, d.plan.requestId));
      await writePlan({ planId: d.plan.id, requestId: d.plan.requestId, customerId: d.plan.customerId, lines: body.lines, urgency: (body.urgency ?? d.plan.urgency) as Urgency, deadline: d.plan.deadlineAt, packSlug: req?.packSlug, title: d.plan.title, status: d.plan.status, opsNote: d.plan.opsNote });
      await audit(user.id, "plan.rebuild", "plan", d.plan.id, null, body.lines, ip); return { ok: true };
    }
    case "plan_send": { await sendPlan(body.planId, user.id, body.note); await audit(user.id, "plan.send", "plan", body.planId, null, { note: body.note }, ip); return { ok: true }; }
    case "task_assign": {
      const reason = need(body.reason, "Manual assignment needs a reason.");
      const [t] = await db.select().from(S.tasks).where(eq(S.tasks.id, body.taskId)); if (!t) throw new ApiError("not_found", "Task not found.", 404);
      if (!["planned", "offered", "accepted"].includes(t.status)) throw new ApiError("invalid_state", "This task can't be reassigned now.");
      await db.update(S.offers).set({ status: "expired", respondedAt: new Date() }).where(and(eq(S.offers.taskId, t.id), eq(S.offers.status, "sent")));
      await db.update(S.tasks).set({ helperId: body.helperId, status: "accepted", updatedAt: new Date() }).where(eq(S.tasks.id, t.id));
      await logEvent(t.id, "assigned_by_ops", user.id, `Assigned by Ops: ${reason}`);
      await notify(body.helperId, "helper_assigned", "You've been assigned a job", t.title, `/helper/jobs/${t.id}`);
      await notify(t.customerId, "helper_changed", "Helper assigned", "Our team assigned a helper to your task.", `/app/orders/${t.id}`);
      await audit(user.id, "task.assign", "task", t.id, { helper: t.helperId }, { helper: body.helperId, reason }, ip); return { ok: true };
    }
    case "task_reoffer": { await dispatchTask(body.taskId, { count: 5 }); await audit(user.id, "task.reoffer", "task", body.taskId, null, null, ip); return { ok: true }; }
    case "dispute_resolve": {
      const note = need(body.message, "Add a message for the customer.");
      const [d] = await db.select().from(S.disputes).where(eq(S.disputes.id, body.id)); if (!d) throw new ApiError("not_found", "Dispute not found.", 404);
      const [t] = await db.select().from(S.tasks).where(eq(S.tasks.id, d.taskId));
      const amount = Math.max(0, Math.round(Number(body.amount || 0) * 100));
      const type = String(body.type);
      if (user.role === "OPS" && amount > 150000) throw new ApiError("limit", "Refunds above ₹1,500 need a Super Admin.");
      if (["partial_refund", "full_refund"].includes(type)) {
        const refund = type === "full_refund" ? t.price : amount;
        await postJournal([{ account: "refunds", debit: refund, memo: "Dispute refund" }, { account: "customer_cash", credit: refund, memo: "Refund to customer" }], "dispute", d.id);
      }
      if (type === "credit") { await db.update(S.customerProfiles).set({ creditsBalance: sql`${S.customerProfiles.creditsBalance} + ${amount}` }).where(eq(S.customerProfiles.userId, t.customerId)); await postJournal([{ account: "promo_cost", debit: amount, memo: "Dispute credit" }, { account: "customer_wallet", credit: amount, memo: "Credit issued" }], "dispute", d.id); }
      await db.update(S.disputes).set({ status: "resolved", resolution: { type, amount, message: note }, assignedOpsId: user.id, updatedAt: new Date() }).where(eq(S.disputes.id, d.id));
      await notify(d.openedBy, "dispute_resolved", "Your dispute was resolved", note, `/app/orders/${d.taskId}`);
      await audit(user.id, "dispute.resolve", "dispute", d.id, null, { type, amount }, ip); return { ok: true };
    }
    case "helper_status": {
      const reason = need(body.reason);
      const [h] = await db.select().from(S.helperProfiles).where(eq(S.helperProfiles.userId, body.id));
      await db.update(S.helperProfiles).set({ status: body.status, online: body.status === "active" ? h.online : false, updatedAt: new Date() }).where(eq(S.helperProfiles.userId, body.id));
      await notify(body.id, "helper_status", body.status === "training" ? "Application approved" : `Account ${body.status}`, reason, "/helper");
      await audit(user.id, "helper.status", "helper", body.id, { status: h.status }, { status: body.status, reason }, ip); return { ok: true };
    }
    case "helper_strike": {
      const reason = need(body.reason);
      await db.insert(S.strikes).values({ helperId: body.id, reason, severity: 1, issuedBy: user.id, expiresAt: new Date(Date.now() + 60 * 864e5) });
      await db.update(S.helperProfiles).set({ strikes: sql`${S.helperProfiles.strikes} + 1` }).where(eq(S.helperProfiles.userId, body.id));
      await notify(body.id, "helper_strike", "You received a strike", reason, "/helper/account"); await audit(user.id, "helper.strike", "helper", body.id, null, { reason }, ip); return { ok: true };
    }
    case "appeal_decide": {
      await db.update(S.strikes).set({ appealStatus: body.decision === "revoke" ? "revoked" : "upheld", ...(body.decision === "revoke" ? { expiresAt: new Date() } : {}) }).where(eq(S.strikes.id, body.id));
      await audit(user.id, "strike.appeal", "strike", body.id, null, { decision: body.decision }, ip); return { ok: true };
    }
    case "college_id": { await db.update(S.helperProfiles).set({ collegeIdStatus: "verified" }).where(eq(S.helperProfiles.userId, body.id)); await audit(user.id, "helper.college_id_verified", "helper", body.id, null, null, ip); return { ok: true }; }
    case "pricing_save": {
      const reason = need(body.reason, "Every pricing change needs a reason.");
      const cur = await getPricing(); const data = { ...cur, ...body.data }; const version = cur.version + 1;
      await db.insert(S.pricingConfigs).values({ version, data: { ...data, version }, reason, createdBy: user.id });
      await audit(user.id, "pricing.save", "pricing", String(version), cur, data, ip); return { ok: true, version };
    }
    case "catalog_update": {
      const patch: Partial<typeof S.categories.$inferInsert> = {};
      if (body.baseRate !== undefined) patch.baseRate = Math.max(1000, Math.round(Number(body.baseRate) * 100));
      if (body.active !== undefined) patch.active = !!body.active; if (body.banned !== undefined) patch.banned = !!body.banned;
      await db.update(S.categories).set({ ...patch, updatedAt: new Date() }).where(eq(S.categories.id, body.id)); await audit(user.id, "catalog.update", "category", body.id, null, patch, ip); return { ok: true };
    }
    case "society_update": { await db.update(S.societies).set({ status: body.status, unlockTarget: Number(body.unlockTarget) || 150, updatedAt: new Date() }).where(eq(S.societies.id, body.id)); await audit(user.id, "society.update", "society", body.id, null, body, ip); return { ok: true }; }
    case "flag_set": { if (user.role !== "SUPER_ADMIN" && !["demo_mode", "auto_dispatch"].includes(body.key)) { /* ops can toggle all in demo */ } const f = await getFlags(); await setSetting("flags", { ...f, [body.key]: !!body.value }); await audit(user.id, "flag.set", "flag", body.key, { v: (f as Record<string, boolean>)[body.key] }, { v: !!body.value }, ip); return { ok: true }; }
    case "sos_status": {
      const [s] = await db.select().from(S.sosEvents).where(eq(S.sosEvents.id, body.id)); if (!s) throw new ApiError("not_found", "SOS not found.", 404);
      await db.update(S.sosEvents).set({ status: body.status, respondedBy: user.id, timeline: [...s.timeline, { at: new Date().toISOString(), text: body.status === "acknowledged" ? "Acknowledged by Ops" : "Resolved by Ops" }] }).where(eq(S.sosEvents.id, s.id));
      await notify(s.userId, "sos", body.status === "acknowledged" ? "Help is on the way" : "SOS resolved", "Our team has responded.", "/app"); await audit(user.id, "sos." + body.status, "sos", s.id, null, null, ip); return { ok: true };
    }
    case "credit": {
      const reason = need(body.reason); const amt = Math.round(Number(body.amount) * 100); if (!amt || amt <= 0 || amt > 500000) throw new ApiError("invalid", "Enter an amount up to ₹5,000.");
      await db.update(S.customerProfiles).set({ creditsBalance: sql`${S.customerProfiles.creditsBalance} + ${amt}` }).where(eq(S.customerProfiles.userId, body.id));
      await postJournal([{ account: "promo_cost", debit: amt, memo: reason }, { account: "customer_wallet", credit: amt, memo: reason }], "credit", body.id);
      await notify(body.id, "credit", "Credit added", reason, "/app/wallet"); await audit(user.id, "customer.credit", "user", body.id, null, { amt, reason }, ip); return { ok: true };
    }
    case "user_status": { const reason = need(body.reason); await db.update(S.users).set({ status: body.status }).where(eq(S.users.id, body.id)); await audit(user.id, "user.status", "user", body.id, null, { status: body.status, reason }, ip); return { ok: true }; }
    case "announce": { await db.update(S.announcements).set({ active: false }); if (body.text) await db.insert(S.announcements).values({ text: String(body.text).slice(0, 200) }); await audit(user.id, "announcement.set", "announcement", "", null, body.text, ip); return { ok: true }; }
    case "handover": { await setSetting("handover", String(body.text ?? "").slice(0, 1000)); return { ok: true }; }
    case "clear_demo_waitlist": { await db.delete(S.waitlist).where(eq(S.waitlist.isDemo, true)); await audit(user.id, "waitlist.clear_demo", "waitlist", "", null, null, ip); return { ok: true }; }
    case "inquiry_status": { await db.update(S.inquiries).set({ status: "done" }).where(eq(S.inquiries.id, body.id)); return { ok: true }; }
    default: throw new ApiError("unknown_action", "Unknown action.");
  }
});
