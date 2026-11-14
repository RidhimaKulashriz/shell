import { db } from "@/db";
import { tasks, helperProfiles, users, offers, addresses, plans, requests, towers, customerProfiles, categories } from "@/db/schema";
import { and, eq, inArray, ne, or, lt, gt, isNotNull } from "drizzle-orm";
import { haversine, etaMinutes } from "./geo";
import { notify } from "./notify";

export type Candidate = {
  helperId: string; name: string; score: number; distanceM: number; etaMin: number;
  breakdown: { rating: number; onTime: number; proximity: number; repeat: number; stacking: number; online: number };
  level: string; ratingAvg: number; jobsDone: number; online: boolean;
};

async function taskContext(taskId: string) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!t) return null;
  const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId));
  const [req] = plan ? await db.select().from(requests).where(eq(requests.id, plan.requestId)) : [];
  const [addr] = req?.addressId ? await db.select().from(addresses).where(eq(addresses.id, req.addressId)) : [];
  const [cat] = await db.select().from(categories).where(eq(categories.id, t.categoryId));
  const [prof] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, t.customerId));
  return { t, plan, req, addr, cat, prof };
}

export async function candidatesFor(taskId: string, exclude: string[] = []): Promise<Candidate[]> {
  const ctx = await taskContext(taskId);
  if (!ctx || !ctx.addr || !ctx.cat) return [];
  const { t, addr, cat, prof } = ctx;
  const [tower] = await db.select().from(towers).where(eq(towers.id, addr.towerId));
  const hs = await db.select({ h: helperProfiles, u: users }).from(helperProfiles).innerJoin(users, eq(users.id, helperProfiles.userId))
    .where(and(eq(helperProfiles.status, "active"), eq(users.status, "active")));
  const out: Candidate[] = [];
  for (const { h, u } of hs) {
    if (exclude.includes(h.userId)) continue;
    if (!h.categories.includes(cat.slug)) continue;
    if (prof?.helperGenderPref === "female" && h.gender !== "female") continue;
    if (t.rush && !h.rushOptIn) continue;
    const busy = t.scheduledStart && t.scheduledEnd ? await db.select({ id: tasks.id, tw: tasks.planId }).from(tasks).where(and(
      eq(tasks.helperId, h.userId), inArray(tasks.status, ["accepted", "en_route", "arrived", "in_progress"]),
      lt(tasks.scheduledStart, t.scheduledEnd), gt(tasks.scheduledEnd, t.scheduledStart))) : [];
    if (busy.length) continue;
    const dist = h.lat && h.lng ? haversine({ lat: h.lat, lng: h.lng }, { lat: addr.lat, lng: addr.lng }) : 2000;
    const prior = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.helperId, h.userId), eq(tasks.customerId, t.customerId), eq(tasks.status, "approved"))).limit(1);
    const sameDay = t.scheduledStart ? await db.select({ id: tasks.id, planId: tasks.planId }).from(tasks).where(and(
      eq(tasks.helperId, h.userId), inArray(tasks.status, ["accepted", "en_route", "in_progress"]), isNotNull(tasks.scheduledStart))) : [];
    const breakdown = {
      rating: +(Math.min(h.ratingAvg, 5) / 5 * 0.3).toFixed(3),
      onTime: +(h.onTimeRate * 0.2).toFixed(3),
      proximity: +(Math.max(0, 1 - dist / (h.radiusM || 3000)) * 0.2).toFixed(3),
      repeat: prior.length ? 0.15 : 0,
      stacking: sameDay.length && tower ? 0.1 : 0,
      online: h.online ? 0.05 : 0,
    };
    const score = +Object.values(breakdown).reduce((a, b) => a + b, 0).toFixed(3);
    out.push({ helperId: h.userId, name: u.name, score, distanceM: Math.round(dist), etaMin: etaMinutes(dist, addr.floor), breakdown, level: h.level, ratingAvg: h.ratingAvg, jobsDone: h.jobsDone, online: h.online });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Offer a task to the top candidates. First to accept wins. */
export async function dispatchTask(taskId: string, opts: { count?: number; exclude?: string[]; priority?: boolean } = {}) {
  const previous = await db.select().from(offers).where(eq(offers.taskId, taskId));
  const exclude = [...(opts.exclude ?? []), ...previous.filter((o) => o.status === "declined" || o.status === "expired").map((o) => o.helperId)];
  const cands = (await candidatesFor(taskId, exclude)).slice(0, opts.count ?? 3);
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!t) return [];
  for (const c of cands) {
    const existing = previous.find((o) => o.helperId === c.helperId && o.status === "sent");
    if (existing) continue;
    await db.insert(offers).values({ taskId, helperId: c.helperId, payout: t.helperPayout, score: { total: c.score, ...c.breakdown }, expiresAt: new Date(Date.now() + 15 * 60000) });
    await notify(c.helperId, "helper_offer", "New job offer", `${t.title}. You earn ₹${Math.round(t.helperPayout / 100)}.`, "/helper");
  }
  if (cands.length || previous.some((o) => o.status === "sent")) await db.update(tasks).set({ status: "offered", updatedAt: new Date() }).where(and(eq(tasks.id, taskId), eq(tasks.status, "planned")));
  return cands;
}

/** Re-offer tasks whose offers all expired or were declined. */
export async function reofferStale() {
  const cutoff = new Date();
  await db.update(offers).set({ status: "expired", respondedAt: cutoff }).where(and(eq(offers.status, "sent"), lt(offers.expiresAt, cutoff)));
  const stuck = await db.select().from(tasks).where(and(eq(tasks.status, "offered"), isNull(tasks.helperId)));
  for (const t of stuck) {
    const open = await db.select().from(offers).where(and(eq(offers.taskId, t.id), eq(offers.status, "sent")));
    if (!open.length) await dispatchTask(t.id);
  }
}
import { isNull } from "drizzle-orm";
void ne; void or;
