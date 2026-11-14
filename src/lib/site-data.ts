import { asc, count, inArray, isNotNull, sql, eq } from "drizzle-orm";
import { db } from "@/db";
import { packs, societies, taskCategories, taskTemplates, waitlist } from "@/db/schema";
import { activePricing, toTemplate } from "@/lib/data";
import { quote, type Size } from "@/lib/pricing";
import type { CatalogTpl } from "@/components/home/HeroComposer";
import type { PackCard } from "@/components/home/Sections";
import type { Rate } from "@/components/EarnCalculator";

export async function catalogForClient(): Promise<CatalogTpl[]> {
  const rows = await db.select().from(taskTemplates).where(eq(taskTemplates.active, true)).orderBy(asc(taskTemplates.displayOrder));
  return rows.map((r) => ({ ...toTemplate(r), nameHi: r.nameHi }));
}

export async function packCards(): Promise<(PackCard & { nameHi: string; copy: string; copyHi: string })[]> {
  const [ps, tpls, cfg] = await Promise.all([db.select().from(packs).orderBy(asc(packs.displayOrder)), db.select().from(taskTemplates), activePricing()]);
  const map = new Map(tpls.map((t) => [t.slug, t]));
  return ps.map((p) => {
    const lines = p.items.flatMap((i) => (map.get(i.template) ? [{ template: toTemplate(map.get(i.template)!), qty: i.qty, size: (i.size ?? "medium") as Size }] : []));
    const q = quote({ lines, managed: true, config: cfg });
    return { slug: p.slug, name: p.nameEn, nameHi: p.nameHi, copy: p.copyEn, copyHi: p.copyHi, icon: p.icon, tasks: p.items.map((i) => i.label), minutes: q.minutes, from: q.range[0] };
  });
}

export async function earnRates(): Promise<Rate[]> {
  const want: [string, string, string][] = [["clean-room", "Cleaning", "house-cleaning"], ["groceries", "Groceries", "groceries"], ["excel-help", "Excel help", "excel-data-help"], ["tutoring", "Explaining", "tutoring"], ["pet-walk", "Pet walks", "pet-walking"], ["event-help", "Event help", "event-help"]];
  const rows = await db.select().from(taskTemplates).where(inArray(taskTemplates.slug, want.map((w) => w[0])));
  const cfg = await activePricing();
  return want.flatMap(([slug, label]) => {
    const t = rows.find((r) => r.slug === slug);
    return t ? [{ slug, label, hourly: Math.round(t.baseRate * (60 / t.minutesPerUnit) * (1 - cfg.commissionPct.TRUSTED)) }] : [];
  });
}

const demoOk = () => process.env.SHOW_DEMO_DATA !== "false";

export async function societyList() {
  const soc = await db.select().from(societies).orderBy(asc(societies.name));
  const counts = await db.select({ id: waitlist.societyId, n: count() }).from(waitlist).where(demoOk() ? sql`true` : eq(waitlist.demo, false)).groupBy(waitlist.societyId);
  const m = new Map(counts.map((c) => [c.id, Number(c.n)]));
  return soc.map((s) => ({ id: s.id, name: s.name, slug: s.slug, lat: s.centroidLat, lng: s.centroidLng, count: m.get(s.id) ?? 0, target: s.waitlistTarget, status: s.status }));
}

/** Hex-level density only. Hexes with fewer than `minK` people are hidden so nobody can be located. */
export async function hexCounts(minK = 3) {
  const rows = await db.select({ id: waitlist.hex8, n: count() }).from(waitlist).where(isNotNull(waitlist.hex8)).groupBy(waitlist.hex8);
  return rows.filter((r) => Number(r.n) >= minK).map((r) => ({ id: r.id as string, count: Number(r.n) }));
}

export async function categoryList() {
  return db.select().from(taskCategories).orderBy(asc(taskCategories.displayOrder));
}
