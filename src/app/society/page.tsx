import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { addresses, announcements, circles, customerProfiles, helpers, plans, societies, tasks, towers } from "@/db/schema";
import { Act } from "@/components/ops/Actions";
import { H1, Table, Tile } from "@/components/ops/ui";
import { Wordmark } from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { inr } from "@/lib/format";

export const metadata = { title: "Society partner portal", robots: { index: false } };

export default async function Page() {
  await requireUser(["SOCIETY_PARTNER"], "/app/login");
  const [s] = await db.select().from(societies).where(eq(societies.status, "pilot")).limit(1);
  const [tw, addrs, cs, hs, an] = await Promise.all([db.select().from(towers).where(eq(towers.societyId, s.id)), db.select().from(addresses).where(eq(addresses.societyId, s.id)), db.select().from(circles).where(eq(circles.societyId, s.id)), db.select().from(helpers).where(eq(helpers.status, "active")), db.select().from(announcements).where(eq(announcements.societyId, s.id))]);
  const custIds = addrs.map((a) => a.userId);
  const ps = custIds.length ? await db.select().from(plans).where(and(inArray(plans.customerId, custIds), eq(plans.status, "approved"))) : [];
  const [{ n: jobs }] = await db.select({ n: count() }).from(tasks).where(eq(tasks.status, "approved"));
  const gmv = ps.reduce((a, p) => a + p.total, 0);
  const share = Math.round((gmv * s.revenueSharePct) / 100);
  void customerProfiles;
  return (
    <main id="main" className="mx-auto max-w-5xl space-y-5 bg-paper p-5 md:p-8">
      <div className="text-forest"><Wordmark size={30} /></div><H1 sub={`${s.name}. Revenue share ${s.revenueSharePct}% of fees goes to the society fund.`}>Society partner portal</H1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Tile label="Verified residents" value={addrs.filter((a) => a.verifiedAt).length} /><Tile label="Jobs done" value={Number(jobs)} tone="sage" /><Tile label="Plans GMV" value={inr(gmv)} /><Tile label="Society fund share" value={inr(share)} tone="sand" /></div>
      <section><h2 className="display text-xl">Resident list (verification)</h2><Table cols={["Tower", "Floor", "Flat", "Verified"]} rows={addrs.map((a) => [tw.find((t) => t.id === a.towerId)?.name ?? "-", a.floor, a.flat, a.verifiedAt ? "verified" : "pending"])} /></section>
      <section><h2 className="display text-xl">Allowed helper roster</h2><Table cols={["Helper", "Level", "Rating", "Gate pass"]} rows={hs.map((h) => [h.displayName, h.level, h.ratingAvg.toFixed(1), <span key={h.id} className="stamp">approved</span>])} /></section>
      <section><h2 className="display text-xl">Circle activity per tower</h2><Table cols={["Circle", "Tower", "Flats", "Status"]} rows={cs.map((c) => [c.title, tw.find((t) => t.id === c.towerId)?.name ?? "-", `${c.currentFlats}/${c.maxFlats}`, c.status])} /></section>
      <section><h2 className="display text-xl">Announcements</h2>{an.map((a) => <p key={a.id} className="note mt-3 !p-3">{a.text}</p>)}<p className="mt-2 text-xs">Broadcasts to residents are sent by Shell ops on your request, in English and Hindi.</p></section>
      <Act url="/api/auth/logout" label="Log out" variant="btn-ghost" />
    </main>
  );
}
