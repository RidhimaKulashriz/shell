import { asc, count, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { announcements, packs, societies, taskCategories, towers, waitlist } from "@/db/schema";
import { CATEGORIES, PACKS, type CategorySeed, type PackSeed } from "./catalog";

export type CategoryRow = {
  slug: string;
  nameEn: string;
  nameHi: string;
  iconId: string;
  baseRate: number;
  priceMin: number;
  priceMax: number;
  content: CategorySeed;
};
export type PackRow = { slug: string; nameEn: string; nameHi: string; startingPrice: number; content: PackSeed };

const DEMO_SOCIETIES = [
  {
    slug: "sunrise-heights-dwarka",
    name: "Sunrise Heights",
    city: "Delhi",
    area: "Dwarka Sector 12",
    status: "pilot",
    lat: 28.5921,
    lng: 77.0460,
    unlockTarget: 500,
  },
  {
    slug: "greenfields-vasant-kunj",
    name: "Greenfields Apartments",
    city: "Delhi",
    area: "Vasant Kunj",
    status: "waitlist",
    lat: 28.5200,
    lng: 77.1590,
    unlockTarget: 500,
  },
  {
    slug: "palm-court-rohini",
    name: "Palm Court",
    city: "Delhi",
    area: "Rohini Sector 9",
    status: "waitlist",
    lat: 28.7041,
    lng: 77.1025,
    unlockTarget: 500,
  },
];

let seeded: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seeded) {
    seeded = doSeed().catch((e) => {
      seeded = null;
      throw e;
    });
  }
  return seeded;
}

async function doSeed() {
  const [{ n: catCount }] = await db.select({ n: count() }).from(taskCategories);
  if (Number(catCount) === 0) {
    await db.insert(taskCategories).values(
      CATEGORIES.map((c, i) => ({
        slug: c.slug,
        nameEn: c.en,
        nameHi: c.hi,
        iconId: c.icon,
        baseRate: c.rate * 100,
        priceMin: c.min * 100,
        priceMax: c.max * 100,
        displayOrder: i,
        content: c,
      })),
    ).onConflictDoNothing();
  }
  const [{ n: packCount }] = await db.select({ n: count() }).from(packs);
  if (Number(packCount) === 0) {
    const rateOf = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.rate ?? 150;
    await db.insert(packs).values(
      PACKS.map((p, i) => ({
        slug: p.slug,
        nameEn: p.en,
        nameHi: p.hi,
        startingPrice: Math.round(p.tasks.reduce((a, t) => a + rateOf(t.slug) * t.hours, 0) * 0.85) * 100,
        displayOrder: i,
        content: p,
      })),
    ).onConflictDoNothing();
  }
  const [{ n: socCount }] = await db.select({ n: count() }).from(societies);
  if (Number(socCount) === 0) {
    const inserted = await db.insert(societies).values(
      DEMO_SOCIETIES.map((s, i) => ({
        ...s,
        gates:
          i === 0
            ? [
                { name: "Gate 1", lat: 28.5932, lng: 77.0448, hours: "24x7", rules: "Helpers register with the guard; gate pass QR shown." },
                { name: "Gate 2", lat: 28.5909, lng: 77.0475, hours: "6 am to 10 pm", rules: "Service entry. Pass checked and photographed." },
              ]
            : [],
      })),
    ).onConflictDoNothing().returning();
    const demo = inserted.find((s) => s.slug === "sunrise-heights-dwarka");
    if (demo) {
      await db.insert(towers).values(
        ["A", "B", "C", "D", "E", "F"].map((n, i) => ({
          societyId: demo.id,
          name: `Tower ${n}`,
          floors: 12 + (i % 3),
          liftNotes: i % 2 === 0 ? "Two lifts; service lift near the lobby 2." : "One passenger lift, one service lift at the back.",
          lat: 28.5921 + (Math.floor(i / 3) - 0.5) * 0.0018,
          lng: 77.046 + ((i % 3) - 1) * 0.0022,
        })),
      );
    }
  }
  const [{ n: annCount }] = await db.select({ n: count() }).from(announcements);
  if (Number(annCount) === 0) {
    await db.insert(announcements).values({
      text: "Now onboarding Tower A to F at Sunrise Heights. {count} neighbours waiting.",
      textHi: "Sunrise Heights ke Tower A se F mein shuru ho rahe hain. {count} padosi intezaar mein.",
    });
  }
}

export async function getCategories(): Promise<CategoryRow[]> {
  await ensureSeeded();
  const rows = await db.select().from(taskCategories).orderBy(asc(taskCategories.displayOrder));
  return rows.map((r) => ({ ...r, content: r.content as CategorySeed }));
}

export async function getCategory(slug: string): Promise<CategoryRow | null> {
  await ensureSeeded();
  const [r] = await db.select().from(taskCategories).where(eq(taskCategories.slug, slug)).limit(1);
  return r ? { ...r, content: r.content as CategorySeed } : null;
}

export async function getPacks(): Promise<PackRow[]> {
  await ensureSeeded();
  const rows = await db.select().from(packs).orderBy(asc(packs.displayOrder));
  return rows.map((r) => ({ ...r, content: r.content as PackSeed }));
}

export async function getPack(slug: string): Promise<PackRow | null> {
  await ensureSeeded();
  const [r] = await db.select().from(packs).where(eq(packs.slug, slug)).limit(1);
  return r ? { ...r, content: r.content as PackSeed } : null;
}

export async function getSocieties() {
  await ensureSeeded();
  const rows = await db.select().from(societies).orderBy(asc(societies.name));
  const counts = await db
    .select({ societyId: waitlist.societyId, n: count() })
    .from(waitlist)
    .where(isNotNull(waitlist.verifiedAt))
    .groupBy(waitlist.societyId);
  const map = new Map(counts.map((c) => [c.societyId, Number(c.n)]));
  return rows.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    city: s.city,
    area: s.area,
    status: s.status,
    lat: s.lat,
    lng: s.lng,
    unlockTarget: s.unlockTarget,
    waiting: map.get(s.id) ?? 0,
  }));
}

export async function getTowers(societyId: string) {
  return db.select().from(towers).where(eq(towers.societyId, societyId)).orderBy(asc(towers.name));
}

/** Honest numbers only. Anything we do not have yet is zero. */
export async function getStats() {
  await ensureSeeded();
  const [{ n }] = await db.select({ n: count() }).from(waitlist).where(isNotNull(waitlist.verifiedAt));
  const [{ e }] = await db
    .select({ e: sql<number>`count(*) filter (where ${waitlist.role} in ('earn','both'))` })
    .from(waitlist)
    .where(isNotNull(waitlist.verifiedAt));
  return {
    neighbours: Number(n),
    helperApplicants: Number(e),
    helpersVerified: 0, // Phase 1: HelperProfile.kycStatus = verified
    jobsCompleted: 0, // Phase 1: Task.status = approved
    avgRating: null as number | null, // Phase 1: Review aggregate
  };
}

export async function getAnnouncement(): Promise<{ en: string; hi: string } | null> {
  await ensureSeeded();
  const [a] = await db.select().from(announcements).where(eq(announcements.active, true)).limit(1);
  if (!a) return null;
  const { neighbours } = await getStats();
  const fill = (t: string) =>
    neighbours >= 10
      ? t.replace("{count}", String(neighbours))
      : t.replace(/\s*\{count\} neighbours waiting\.?/, " Be one of the first.").replace(/\s*\{count\} padosi intezaar mein\.?/, " Pehle logon mein shaamil ho jao.");
  return { en: fill(a.text), hi: fill(a.textHi ?? a.text) };
}
