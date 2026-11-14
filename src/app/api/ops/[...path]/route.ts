import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { customerProfiles, disputes, featureFlags, fraudAlerts, helpers, offers, plans, pricingConfigs, requests, societies, sosEvents, strikes, taskTemplates, tasks, users } from "@/db/schema";
import { AppError, api, body, need } from "@/lib/api";
import { audit } from "@/lib/audit";
import { activePricing } from "@/lib/data";
import { createPlan, logEvent, repricePlan } from "@/lib/plans";
import { suggestHelpers } from "@/lib/dispatch";
import { recordRefund } from "@/lib/money";
import { canTransition } from "@/lib/statemachine";
import { notify } from "@/lib/notify";
import { DEFAULT_PRICING } from "@/lib/pricing";

const OPS = ["OPS", "SUPER_ADMIN"];
const REFUND_LIMIT: Record<string, number> = { ops_agent: 50000, ops_lead: 500000, finance: 500000, super_admin: Infinity };

export const GET = api<{ path: string[] }>(async ({ params }) => {
  const [a, b] = params.path;
  if (a === "requests") return { requests: await db.select().from(requests).where(inArray(requests.status, ["new", "clarifying", "in_review"])).orderBy(requests.slaDueAt) };
  if (a === "alerts") return { fraud: await db.select().from(fraudAlerts).where(eq(fraudAlerts.status, "open")).orderBy(desc(fraudAlerts.createdAt)), sos: await db.select().from(sosEvents).where(eq(sosEvents.status, "open")) };
  if (a === "disputes") return { disputes: await db.select().from(disputes).orderBy(disputes.slaDueAt) };
  if (a === "pricing-config") return { current: await activePricing(), history: await db.select().from(pricingConfigs).orderBy(desc(pricingConfigs.version)) };
  if (a === "catalog") return { templates: await db.select().from(taskTemplates) };
  if (a === "societies") return { societies: await db.select().from(societies) };
  if (a === "suggest" && b) return { suggestions: await suggestHelpers(b, 6) };
  throw new AppError(404, "not_found", "Unknown ops resource");
}, { roles: OPS });

export const POST = api<{ path: string[] }>(async ({ req, params, user }) => {
  const [a, id, act] = params.path;
  const opsRole = user!.opsRole ?? "ops_agent";

  if (a === "plans" && !id) {
    const b = await body(req, z.object({ requestId: z.string().uuid(), title: z.string().min(2).max(120), items: z.array(z.object({ template: z.string(), qty: z.number().int().min(1).max(20), size: z.enum(["small", "medium", "large"]).default("medium") })).min(1), urgency: z.enum(["normal", "same_day", "rush"]).default("normal"), managed: z.boolean().default(false), deadlineAt: z.string().datetime().optional() }));
    const [r] = await db.select().from(requests).where(eq(requests.id, b.requestId)).limit(1);
    need(r, "Request");
    const res = await createPlan({ customerId: r.customerId, addressId: r.addressId, requestId: r.id, title: b.title, items: b.items, urgency: b.urgency, managed: b.managed, deadlineAt: b.deadlineAt ? new Date(b.deadlineAt) : r.deadlineAt });
    await db.update(requests).set({ status: "in_review", assignedOpsId: user!.id, updatedAt: new Date() }).where(eq(requests.id, r.id));
    await audit({ actorId: user!.id, action: "plan_created", entity: "plan", entityId: res.planId, after: { total: res.quote.total }, req });
    return { planId: res.planId, total: res.quote.total };
  }
  if (a === "plans" && id && act === "send") {
    const [p] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
    need(p, "Plan");
    await db.update(plans).set({ status: "sent", sentAt: new Date(), expiresAt: new Date(Date.now() + 48 * 3600000), updatedAt: new Date() }).where(eq(plans.id, id));
    if (p.requestId) await db.update(requests).set({ status: "plan_sent", updatedAt: new Date() }).where(eq(requests.id, p.requestId));
    await audit({ actorId: user!.id, action: "plan_sent", entity: "plan", entityId: id, req });
    await notify(p.customerId, "plan_ready", { link: `/app/plans/${id}` });
    return { ok: true };
  }
  if (a === "plans" && id && act === "reprice") {
    const b = await body(req, z.object({ urgency: z.enum(["normal", "same_day", "rush"]).optional(), managed: z.boolean().optional() }));
    const q = await repricePlan(id, b);
    return { total: q.total };
  }
  if (a === "tasks" && id && (act === "assign" || act === "reassign")) {
    const b = await body(req, z.object({ helperId: z.string().uuid(), reason: z.string().min(3, "A reason is required for manual assignment").max(200) }));
    const [t] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    need(t, "Task");
    await db.update(tasks).set({ assignedHelperId: b.helperId, status: ["planned", "offered"].includes(t.status) ? "accepted" : t.status, updatedAt: new Date() }).where(eq(tasks.id, id));
    await db.update(offers).set({ status: "expired" }).where(eq(offers.taskId, id));
    await logEvent(id, t.planId, act === "assign" ? "helper_assigned" : "helper_changed", { by: "ops", reason: b.reason, helperId: b.helperId }, user!.id);
    await audit({ actorId: user!.id, action: `task_${act}`, entity: "task", entityId: id, before: { helper: t.assignedHelperId }, after: { helper: b.helperId, reason: b.reason }, req });
    const [pl] = await db.select().from(plans).where(eq(plans.id, t.planId)).limit(1);
    const [h] = await db.select().from(helpers).where(eq(helpers.id, b.helperId)).limit(1);
    await notify(pl.customerId, act === "assign" ? "helper_assigned" : "helper_changed", { helper: h?.displayName.split(" ")[0] ?? "", task: t.name });
    return { ok: true };
  }
  if (a === "disputes" && id && act === "resolve") {
    const b = await body(req, z.object({ action: z.enum(["redo", "partial_refund", "full_refund", "credit", "no_action"]), amount: z.number().int().min(0).default(0), note: z.string().max(400).default("") }));
    const [d] = await db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
    need(d, "Dispute");
    const [t] = await db.select().from(tasks).where(eq(tasks.id, d.taskId)).limit(1);
    const amount = b.action === "full_refund" ? (t?.price ?? 0) : b.amount;
    if (["partial_refund", "full_refund", "credit"].includes(b.action) && amount > (REFUND_LIMIT[opsRole] ?? 0) && user!.role !== "SUPER_ADMIN") throw new AppError(403, "over_limit", `Your approval limit is ₹${(REFUND_LIMIT[opsRole] ?? 0) / 100}. Escalate to a lead.`);
    if (b.action === "partial_refund" || b.action === "full_refund") await recordRefund("dispute", id, amount, false);
    if (b.action === "credit") {
      const [p] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, d.openedBy)).limit(1);
      if (p) await db.update(customerProfiles).set({ creditsBalance: p.creditsBalance + amount }).where(eq(customerProfiles.userId, d.openedBy));
    }
    await db.update(disputes).set({ status: "resolved", resolution: { action: b.action, amount, note: b.note }, updatedAt: new Date() }).where(eq(disputes.id, id));
    await audit({ actorId: user!.id, action: "dispute_resolved", entity: "dispute", entityId: id, after: { ...b, amount }, req });
    await notify(d.openedBy, "dispute_resolved", { outcome: b.action.replace("_", " ") });
    return { ok: true };
  }
  if (a === "helpers" && id && act === "strike") {
    const b = await body(req, z.object({ reason: z.string().min(3).max(200), severity: z.number().int().min(1).max(3).default(1), evidence: z.string().max(300).optional() }));
    await db.insert(strikes).values({ helperId: id, reason: b.reason, severity: b.severity, evidence: b.evidence ?? "", issuedBy: user!.id, expiresAt: new Date(Date.now() + 90 * 86400000) });
    const [h] = await db.select().from(helpers).where(eq(helpers.id, id)).limit(1);
    await db.update(helpers).set({ strikes: (h?.strikes ?? 0) + 1 }).where(eq(helpers.id, id));
    await audit({ actorId: user!.id, action: "strike_issued", entity: "helper", entityId: id, after: b, req });
    if (h) await notify(h.userId, "helper_strike", { reason: b.reason });
    return { ok: true };
  }
  if (a === "helpers" && id && act === "status") {
    const b = await body(req, z.object({ status: z.enum(["applied", "review", "training", "shadow", "active", "paused", "suspended", "banned"]), reason: z.string().min(3).max(200), payoutHold: z.boolean().optional() }));
    const [h] = await db.select().from(helpers).where(eq(helpers.id, id)).limit(1);
    need(h, "Helper");
    if (!canTransition("helper", h.status, b.status)) throw new AppError(409, "bad_transition", `A helper cannot move from ${h.status} to ${b.status}.`);
    if (b.status === "active" && (!h.safetyTrainingPassedAt || h.kycStatus !== "verified")) throw new AppError(409, "not_ready", "Safety training and verified ID are required before a helper can go active.");
    await db.update(helpers).set({ status: b.status, ...(b.payoutHold !== undefined ? { payoutHold: b.payoutHold } : {}), ...(b.status !== "active" ? { online: false } : {}), updatedAt: new Date() }).where(eq(helpers.id, id));
    await audit({ actorId: user!.id, action: "helper_status", entity: "helper", entityId: id, before: { status: h.status }, after: b, req });
    return { ok: true };
  }
  if (a === "alerts" && id) {
    const b = await body(req, z.object({ action: z.enum(["dismiss", "warn", "strike", "hold_payout", "suspend", "escalate"]) }));
    const [al] = await db.select().from(fraudAlerts).where(eq(fraudAlerts.id, id)).limit(1);
    need(al, "Alert");
    if (b.action === "hold_payout" && al.refType === "helper" && al.refId) await db.update(helpers).set({ payoutHold: true }).where(eq(helpers.id, al.refId));
    if (b.action === "suspend" && al.refType === "helper" && al.refId) await db.update(helpers).set({ status: "suspended", online: false }).where(eq(helpers.id, al.refId));
    await db.update(fraudAlerts).set({ status: b.action === "escalate" ? "escalated" : "closed", action: b.action }).where(eq(fraudAlerts.id, id));
    await audit({ actorId: user!.id, action: `fraud_${b.action}`, entity: "fraud_alert", entityId: id, req });
    return { ok: true };
  }
  if (a === "sos" && id) {
    const b = await body(req, z.object({ action: z.enum(["ack", "resolve"]), note: z.string().max(300).optional() }));
    const [s] = await db.select().from(sosEvents).where(eq(sosEvents.id, id)).limit(1);
    need(s, "SOS");
    const now = new Date().toISOString();
    await db.update(sosEvents).set({ status: b.action === "ack" ? "acknowledged" : "resolved", respondedBy: user!.id, timeline: [...s.timeline, { ts: now, text: `${b.action === "ack" ? "Acknowledged" : "Resolved"} by ${user!.name}${b.note ? ": " + b.note : ""}` }], ...(b.action === "resolve" ? { report: b.note ?? "" } : {}) }).where(eq(sosEvents.id, id));
    await audit({ actorId: user!.id, action: `sos_${b.action}`, entity: "sos", entityId: id, req });
    if (b.action === "resolve") await notify(s.userId, "sos_resolved", {});
    return { ok: true };
  }
  if (a === "customers" && id && act === "credit") {
    const b = await body(req, z.object({ amount: z.number().int().min(-1000000).max(1000000), reason: z.string().min(3).max(200) }));
    const [p] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, id)).limit(1);
    need(p, "Customer");
    await db.update(customerProfiles).set({ creditsBalance: Math.max(0, p.creditsBalance + b.amount) }).where(eq(customerProfiles.userId, id));
    await audit({ actorId: user!.id, action: "credit_adjusted", entity: "customer", entityId: id, before: { credits: p.creditsBalance }, after: b, req });
    return { ok: true };
  }
  if (a === "customers" && id && act === "block") {
    await db.update(users).set({ status: "suspended" }).where(eq(users.id, id));
    await audit({ actorId: user!.id, action: "customer_blocked", entity: "customer", entityId: id, req });
    return { ok: true };
  }
  if (a === "flags" && id) {
    const b = await body(req, z.object({ enabled: z.boolean() }));
    await db.update(featureFlags).set({ enabled: b.enabled }).where(eq(featureFlags.key, id));
    await audit({ actorId: user!.id, action: "flag_toggled", entity: "feature_flag", entityId: id, after: b, req });
    return { ok: true };
  }
  if (a === "catalog" && id) {
    const b = await body(req, z.object({ baseRate: z.number().int().min(0).optional(), active: z.boolean().optional(), reason: z.string().min(3).max(200) }));
    const [t] = await db.select().from(taskTemplates).where(eq(taskTemplates.slug, id)).limit(1);
    need(t, "Task");
    await db.update(taskTemplates).set({ ...(b.baseRate !== undefined ? { baseRate: b.baseRate } : {}), ...(b.active !== undefined ? { active: b.active } : {}) }).where(eq(taskTemplates.slug, id));
    await audit({ actorId: user!.id, action: "catalog_edit", entity: "task_template", entityId: id, before: { baseRate: t.baseRate, active: t.active }, after: b, req });
    return { ok: true };
  }
  if (a === "societies" && id) {
    const b = await body(req, z.object({ status: z.enum(["waitlist", "pilot", "live"]), reason: z.string().min(3).max(200) }));
    await db.update(societies).set({ status: b.status, goLiveAt: b.status === "live" ? new Date() : null }).where(eq(societies.id, id));
    await audit({ actorId: user!.id, action: "society_status", entity: "society", entityId: id, after: b, req });
    return { ok: true };
  }
  throw new AppError(404, "not_found", "Unknown ops action");
}, { roles: OPS });

/** Pricing config is versioned, needs a reason, and is editable without a deploy. */
export const PUT = api<{ path: string[] }>(async ({ req, params, user }) => {
  if (params.path[0] !== "pricing-config") throw new AppError(404, "not_found", "Unknown ops resource");
  const b = await body(req, z.object({ data: z.record(z.string(), z.unknown()), reason: z.string().min(3, "Every change needs a reason").max(300) }));
  const cur = await activePricing();
  const next = { ...DEFAULT_PRICING, ...cur, ...b.data } as typeof cur;
  if (typeof next.minOrder !== "number" || next.minOrder < 0 || next.feePercent < 0 || next.feePercent > 0.3) throw new AppError(400, "bad_config", "Config values are out of range.");
  const version = cur.version + 1;
  await db.insert(pricingConfigs).values({ version, data: { ...next, version } as never, createdBy: user!.id, reason: b.reason });
  await audit({ actorId: user!.id, action: "pricing_config_published", entity: "pricing_config", entityId: String(version), before: cur, after: next, req });
  return { ok: true, version };
}, { roles: OPS });
