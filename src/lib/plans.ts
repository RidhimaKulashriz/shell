import { and, eq, ne } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import { plans, taskEvents, tasks, taskTemplates, helpers } from "@/db/schema";
import { activePricing, toTemplate } from "@/lib/data";
import { helperPayout, planTotalIsConsistent, quote, type Size, type Urgency } from "@/lib/pricing";
import { doorOtpHash } from "@/lib/otp";

export type PlanItem = { template: string; qty: number; size?: Size; offsetHours?: number };

export async function logEvent(taskId: string | null, planId: string | null, kind: string, detail: Record<string, unknown> = {}, actorId?: string | null) {
  await db.insert(taskEvents).values({ taskId, planId, kind, detail, actorId: actorId ?? null });
}

/** Recompute every price on a plan from its (non-cancelled) tasks using the active pricing config. */
export async function repricePlan(planId: string, patch: { urgency?: Urgency; circleJoiners?: number; travelPaise?: number; managed?: boolean } = {}) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!plan) throw new Error("Plan not found");
  const cfg = await activePricing();
  const live = await db.select().from(tasks).where(and(eq(tasks.planId, planId), ne(tasks.status, "cancelled"))).orderBy(tasks.sequence);
  const tplRows = await db.select().from(taskTemplates);
  const tplMap = new Map(tplRows.map((t) => [t.slug, t]));
  const urgency = (patch.urgency ?? plan.urgency) as Urgency;
  const joiners = patch.circleJoiners ?? (plan.circleDiscount > 0 ? Math.max(2, [...cfg.circleCurve].reverse().find((c) => c.discount <= plan.circleDiscount)?.flats ?? 2) : 1);
  const q = quote({
    lines: live.flatMap((t) => {
      const tpl = tplMap.get(t.templateSlug);
      return tpl ? [{ template: toTemplate(tpl), qty: t.quantity, size: t.size as Size }] : [];
    }),
    urgency,
    circleJoiners: joiners,
    travelPaise: patch.travelPaise ?? plan.travelAmount,
    managed: patch.managed ?? plan.managed,
    config: cfg,
  });
  const helperLevels = new Map((await db.select({ id: helpers.id, level: helpers.level }).from(helpers)).map((h) => [h.id, h.level]));
  let i = 0;
  for (const t of live) {
    const line = tplMap.has(t.templateSlug) ? q.lines[i++] : null;
    if (!line) continue;
    await db.update(tasks).set({ price: line.price, durationEstMin: line.minutes, helperPayout: helperPayout(line.price, t.assignedHelperId ? (helperLevels.get(t.assignedHelperId) ?? "STARTER") : "STARTER", cfg), updatedAt: new Date() }).where(eq(tasks.id, t.id));
  }
  const next = {
    subtotal: q.subtotal,
    urgency,
    urgencyMultiplier: q.urgencyMultiplier,
    circleDiscount: q.circleDiscount,
    travelAmount: q.travel,
    platformFee: q.platformFee,
    coordinationFee: q.coordinationFee,
    total: q.total,
    managed: q.managed,
    pricingConfigVersion: cfg.version,
    updatedAt: new Date(),
  };
  if (!planTotalIsConsistent({ ...next }, cfg.minOrder)) throw new Error("Plan total does not match its lines");
  await db.update(plans).set(next).where(eq(plans.id, planId));
  return q;
}

export async function createPlan(o: { customerId: string; addressId?: string | null; requestId?: string | null; title: string; items: PlanItem[]; urgency?: Urgency; circleJoiners?: number; managed?: boolean; deadlineAt?: Date | null; status?: string; opsNote?: string }) {
  const slugs = o.items.map((i) => i.template);
  const tplRows = await db.select().from(taskTemplates);
  const tplMap = new Map(tplRows.map((t) => [t.slug, t]));
  const valid = o.items.filter((i) => tplMap.has(i.template));
  const [plan] = await db
    .insert(plans)
    .values({ customerId: o.customerId, addressId: o.addressId ?? null, requestId: o.requestId ?? null, title: o.title, status: o.status ?? "draft", urgency: o.urgency ?? "normal", deadlineAt: o.deadlineAt ?? null, shareToken: crypto.randomBytes(9).toString("base64url"), opsNote: o.opsNote ?? null, managed: !!o.managed })
    .returning();
  void slugs;
  let seq = 0;
  for (const it of valid) {
    const t = tplMap.get(it.template)!;
    const start = o.deadlineAt && it.offsetHours !== undefined ? new Date(o.deadlineAt.getTime() + it.offsetHours * 3600000) : null;
    const [row] = await db
      .insert(tasks)
      .values({
        planId: plan.id,
        templateSlug: t.slug,
        name: t.nameEn,
        quantity: it.qty,
        size: it.size ?? "medium",
        sequence: seq++,
        checklist: t.checklist.map((label) => ({ label, done: false })),
        scheduledStart: start,
        scheduledEnd: start ? new Date(start.getTime() + t.minutesPerUnit * it.qty * 60000) : null,
      })
      .returning({ id: tasks.id });
    await db.update(tasks).set({ doorOtpHash: doorOtpHash(row.id) }).where(eq(tasks.id, row.id));
  }
  const q = await repricePlan(plan.id, { urgency: o.urgency, circleJoiners: o.circleJoiners ?? 1, managed: o.managed });
  return { planId: plan.id, quote: q };
}
