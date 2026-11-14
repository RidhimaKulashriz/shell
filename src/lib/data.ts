import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { helpers, pricingConfigs, societies, taskTemplates, tasks, users, waitlist, plans } from "@/db/schema";
import { DEFAULT_PRICING, type PricingConfig, type TemplateLike } from "@/lib/pricing";

export async function activePricing(): Promise<PricingConfig> {
  const [row] = await db.select().from(pricingConfigs).orderBy(desc(pricingConfigs.version)).limit(1);
  return row ? ({ ...DEFAULT_PRICING, ...(row.data as Partial<PricingConfig>), version: row.version } as PricingConfig) : DEFAULT_PRICING;
}

export const toTemplate = (r: typeof taskTemplates.$inferSelect): TemplateLike => ({ slug: r.slug, name: r.nameEn, baseRate: r.baseRate, unit: r.unit, minutesPerUnit: r.minutesPerUnit, sizeFactors: r.sizeFactors, managedOnly: r.managedOnly });

export async function templatesBySlug(slugs?: string[]) {
  const rows = slugs?.length ? await db.select().from(taskTemplates).where(inArray(taskTemplates.slug, slugs)) : await db.select().from(taskTemplates);
  return new Map(rows.map((r) => [r.slug, r]));
}

export async function waitlistStats(societyId?: string) {
  const demoOk = process.env.SHOW_DEMO_DATA !== "false";
  const base = demoOk ? sql`true` : sql`${waitlist.demo} = false`;
  const [{ n }] = await db.select({ n: count() }).from(waitlist).where(societyId ? and(base, eq(waitlist.societyId, societyId)) : base);
  return Number(n);
}

export async function publicCounters() {
  const demoOk = process.env.SHOW_DEMO_DATA !== "false";
  const waiting = await waitlistStats();
  const [h] = await db.select({ n: count() }).from(helpers).where(eq(helpers.status, "active"));
  const [j] = await db.select({ n: count() }).from(tasks).where(eq(tasks.status, "approved"));
  const [r] = await db.select({ avg: sql<number>`coalesce(avg(${helpers.ratingAvg}) filter (where ${helpers.ratingCount} > 0 or ${helpers.jobsDone} > 0),0)` }).from(helpers);
  void demoOk;
  return { waiting, helpers: Number(h.n), jobs: Number(j.n), rating: Number(Number(r.avg).toFixed(1)) };
}

export async function mainSociety() {
  const [s] = await db.select().from(societies).where(inArray(societies.status, ["pilot", "live"])).limit(1);
  return s ?? null;
}

export async function userName(id: string) {
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, id)).limit(1);
  return u?.name ?? "";
}

export async function planWithTasks(planId: string) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!plan) return null;
  const ts = await db.select().from(tasks).where(eq(tasks.planId, planId)).orderBy(tasks.sequence);
  return { plan, tasks: ts };
}
