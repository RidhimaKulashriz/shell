import { db } from "@/db";
import { waitlist, societies, helperProfiles, tasks, reviews, packs, categories } from "@/db/schema";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";

export async function publicStats() {
  const [w] = await db.select({ n: count() }).from(waitlist);
  const [h] = await db.select({ n: count() }).from(helperProfiles).where(eq(helperProfiles.status, "active"));
  const [j] = await db.select({ n: count() }).from(tasks).where(eq(tasks.status, "approved"));
  const [r] = await db.select({ avg: sql<number>`coalesce(avg(${reviews.rating}),0)::float`, n: count() }).from(reviews);
  return { waiting: w.n, helpers: h.n, jobs: j.n, rating: r.avg, reviews: r.n };
}

export async function hexCells(societyId?: string) {
  const rows = await db.select({ hex: waitlist.hex, count: count() }).from(waitlist)
    .where(societyId ? eq(waitlist.societyId, societyId) : sql`${waitlist.hex} is not null`).groupBy(waitlist.hex);
  return rows.filter((r) => r.hex).map((r) => ({ hex: r.hex as string, count: r.count }));
}

export async function societySearch(q: string) {
  const rows = await db.select().from(societies).where(q ? or(ilike(societies.name, `%${q}%`), ilike(societies.area, `%${q}%`)) : undefined).orderBy(desc(societies.createdAt)).limit(6);
  const out = [];
  for (const s of rows) {
    const [c] = await db.select({ n: count() }).from(waitlist).where(eq(waitlist.societyId, s.id));
    out.push({ id: s.id, name: s.name, area: s.area, city: s.city, status: s.status, count: c.n, target: s.unlockTarget });
  }
  return out;
}

export async function allPacks() { return db.select().from(packs).where(eq(packs.active, true)).orderBy(packs.displayOrder); }
export async function allCategories() { return db.select().from(categories).where(and(eq(categories.active, true), eq(categories.banned, false))).orderBy(categories.displayOrder); }
