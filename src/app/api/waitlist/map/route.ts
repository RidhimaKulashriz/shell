import { NextResponse } from "next/server";
import { count, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { ensureSeeded, getSocieties } from "@/lib/data";
import { hexCentre, hexNeighbourhood, hexOutline } from "@/lib/geo";

export const dynamic = "force-dynamic";

// Privacy-safe: hex-level counts only. Hexes with fewer than 3 people are
// reported as "few" so no individual can be located.
export async function GET(req: Request) {
  await ensureSeeded();
  const slug = new URL(req.url).searchParams.get("society");
  const socs = await getSocieties();
  const soc = socs.find((s) => s.slug === slug) ?? socs[0];
  const rows = await db
    .select({ hex: waitlist.hex9, n: count() })
    .from(waitlist)
    .where(sql`${isNotNull(waitlist.hex9)}`)
    .groupBy(waitlist.hex9);
  const counts = new Map(rows.map((r) => [r.hex as string, Number(r.n)]));
  const cells = hexNeighbourhood(soc.lat, soc.lng, 5).map((h) => ({
    id: h,
    centre: hexCentre(h),
    outline: hexOutline(h),
    count: counts.get(h) ?? 0,
  }));
  return NextResponse.json({
    society: { slug: soc.slug, name: soc.name, area: soc.area, lat: soc.lat, lng: soc.lng, waiting: soc.waiting, target: soc.unlockTarget, status: soc.status },
    cells: cells.map((c) => ({ ...c, count: c.count > 0 && c.count < 3 ? 1 : c.count, few: c.count > 0 && c.count < 3 })),
  });
}
