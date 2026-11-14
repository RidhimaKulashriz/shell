import { and, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { addresses, helpers, plans, societies, taskTemplates, tasks } from "@/db/schema";
import { haversine, rideMinutes, walkMinutes } from "@/lib/geo";

export type Scored = { helperId: string; name: string; level: string; rating: number; jobsDone: number; score: number; eligible: boolean; reasons: string[]; breakdown: Record<string, number>; distanceM: number; travelMin: number; why: string; languages: string[]; goodAt: string[]; voiceIntro: string; passportSlug: string | null; online: boolean };

const LEVEL_BONUS: Record<string, number> = { STARTER: 0, TRUSTED: 3, PRO: 6, ELITE: 9 };

/** Candidates: skill + gender + availability filters, then a score:
 *  proximity (travel-time) 25 + skill 20 + rating 20 + on-time 10 + repeat 10 + stacking 6 - load penalty + level bonus. */
export function scoreHelper(
  h: typeof helpers.$inferSelect,
  ctx: { lat: number; lng: number; category: string; femaleOnly: boolean; repeatHelperIds: Set<string>; stackNearby: boolean; load: number; managed: boolean },
): Omit<Scored, "why"> {
  const reasons: string[] = [];
  const d = h.lat != null && h.lng != null ? haversine({ lat: h.lat, lng: h.lng }, ctx) : 1200;
  const travelMin = d < 400 ? walkMinutes(d) : rideMinutes(d);
  const skill = h.categories.some((c) => c.slug === ctx.category);
  if (h.status !== "active") reasons.push("not active");
  if (h.vacation) reasons.push("on vacation");
  if (!skill) reasons.push("no skill in category");
  if (ctx.femaleOnly && !(h.isFemale && h.femaleOnlyEligible)) reasons.push("female-only job");
  if (ctx.managed && !h.managedEligible) reasons.push("not Managed eligible");
  if (ctx.load >= h.dailyCap) reasons.push("daily cap reached");
  if (d > h.radiusM) reasons.push("outside radius");
  const breakdown = {
    distance: Math.max(0, Math.round(25 - travelMin * 1.2)),
    skill: skill ? 20 : 0,
    rating: Math.round((h.ratingAvg / 5) * 20),
    onTime: Math.round(h.onTimeRate * 10),
    repeat: ctx.repeatHelperIds.has(h.id) ? 10 : 0,
    stacking: ctx.stackNearby ? 6 : 0,
    load: -ctx.load * 3,
    level: LEVEL_BONUS[h.level] ?? 0,
  };
  return { helperId: h.id, name: h.displayName, level: h.level, rating: h.ratingAvg, jobsDone: h.jobsDone, score: Object.values(breakdown).reduce((a, b) => a + b, 0), eligible: reasons.length === 0, reasons, breakdown, distanceM: Math.round(d), travelMin, languages: h.languages, goodAt: h.goodAt, voiceIntro: h.voiceIntroText ?? "", passportSlug: h.passportSlug, online: h.online };
}

export function whyWeChose(s: Omit<Scored, "why">, customerFirst = "you") {
  const bits: string[] = [];
  if (s.breakdown.repeat) bits.push(`${customerFirst} have worked with ${s.name.split(" ")[0]} before`);
  if (s.travelMin <= 6) bits.push(`about ${s.travelMin} min away inside the society`);
  if (s.rating >= 4.8) bits.push(`rated ${s.rating.toFixed(1)}`);
  if (s.breakdown.stacking) bits.push("already nearby for another task");
  if (s.jobsDone >= 30) bits.push(`${s.jobsDone} jobs done`);
  if (!bits.length) bits.push("best fit for this task and time");
  return `${s.name.split(" ")[0]}: ${bits.slice(0, 3).join(", ")}.`;
}

export async function suggestHelpers(taskId: string, limit = 5): Promise<Scored[]> {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!t) return [];
  const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId)).limit(1);
  const [tpl] = await db.select().from(taskTemplates).where(eq(taskTemplates.slug, t.templateSlug)).limit(1);
  const [addr] = plan?.addressId ? await db.select().from(addresses).where(eq(addresses.id, plan.addressId)).limit(1) : [];
  const [soc] = addr ? await db.select().from(societies).where(eq(societies.id, addr.societyId)).limit(1) : await db.select().from(societies).limit(1);
  const lat = addr?.lat ?? soc?.centroidLat ?? 28.5921;
  const lng = addr?.lng ?? soc?.centroidLng ?? 77.046;
  const all = await db.select().from(helpers).where(inArray(helpers.status, ["active", "paused", "suspended"]));
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const loads = await db.select({ h: tasks.assignedHelperId, n: sql<number>`count(*)` }).from(tasks).where(and(gte(tasks.scheduledStart, dayStart), ne(tasks.status, "cancelled"))).groupBy(tasks.assignedHelperId);
  const loadMap = new Map(loads.map((l) => [l.h, Number(l.n)]));
  const sameTower = await db.select({ h: tasks.assignedHelperId }).from(tasks).innerJoin(plans, eq(plans.id, tasks.planId)).where(and(eq(plans.addressId, plan?.addressId ?? "00000000-0000-0000-0000-000000000000"), ne(tasks.id, taskId)));
  const nearby = new Set(sameTower.map((x) => x.h).filter(Boolean) as string[]);
  const prior = await db.select({ h: tasks.assignedHelperId }).from(tasks).innerJoin(plans, eq(plans.id, tasks.planId)).where(and(eq(plans.customerId, plan?.customerId ?? "00000000-0000-0000-0000-000000000000"), eq(tasks.status, "approved")));
  const repeat = new Set(prior.map((p) => p.h).filter(Boolean) as string[]);
  return all
    .map((h) => scoreHelper(h, { lat, lng, category: tpl?.categorySlug ?? "", femaleOnly: false, repeatHelperIds: repeat, stackNearby: nearby.has(h.id), load: loadMap.get(h.id) ?? 0, managed: !!tpl?.managedOnly && plan?.managed === true }))
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score)
    .slice(0, limit)
    .map((s) => ({ ...s, why: whyWeChose(s) }));
}
