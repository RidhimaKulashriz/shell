import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, payments, plans, requests, reviews, societies, tasks, waitlist } from "@/db/schema";
import { H1, Table, Tile } from "@/components/ops/ui";
import { inr } from "@/lib/format";

export const metadata = { title: "Analytics" };

export default async function Page() {
  const n = async (q: Promise<{ n: number }[]>) => Number((await q)[0].n);
  const [visits, wl, reqs, sent, approved, paid, done, rated, canc] = await Promise.all([
    n(db.select({ n: count() }).from(analyticsEvents).where(eq(analyticsEvents.event, "page_view"))), n(db.select({ n: count() }).from(waitlist)), n(db.select({ n: count() }).from(requests)),
    n(db.select({ n: count() }).from(plans).where(sql`${plans.sentAt} is not null`)), n(db.select({ n: count() }).from(plans).where(sql`${plans.approvedAt} is not null`)), n(db.select({ n: count() }).from(payments).where(eq(payments.status, "captured"))),
    n(db.select({ n: count() }).from(tasks).where(eq(tasks.status, "approved"))), n(db.select({ n: count() }).from(reviews)), n(db.select({ n: count() }).from(tasks).where(eq(tasks.status, "cancelled"))),
  ]);
  const customers = await db.select({ c: payments.customerId, n: count(), t: sql<number>`sum(${payments.amount})` }).from(payments).where(eq(payments.status, "captured")).groupBy(payments.customerId);
  const repeat = customers.length ? customers.filter((c) => Number(c.n) >= 2).length / customers.length : 0;
  const gmv = customers.reduce((s, c) => s + Number(c.t), 0);
  const [pay] = await db.select({ p: sql<number>`coalesce(sum(${tasks.helperPayout}),0)`, g: sql<number>`coalesce(sum(${tasks.price}),0)` }).from(tasks).where(eq(tasks.status, "approved"));
  const take = Number(pay.g) ? (Number(pay.g) - Number(pay.p)) / Number(pay.g) : 0;
  const rs = await db.select({ r: reviews.rating }).from(reviews);
  const nps = rs.length ? Math.round(((rs.filter((x) => x.r === 5).length - rs.filter((x) => x.r <= 3).length) / rs.length) * 100) : 0;
  const bySoc = await db.select({ s: societies.name, n: count() }).from(waitlist).innerJoin(societies, eq(societies.id, waitlist.societyId)).groupBy(societies.name);
  const wk = await db.select({ w: sql<string>`to_char(date_trunc('week', ${waitlist.createdAt}), 'DD Mon')`, n: count() }).from(waitlist).groupBy(sql`date_trunc('week', ${waitlist.createdAt})`).orderBy(sql`date_trunc('week', ${waitlist.createdAt})`);
  const funnel: [string, number][] = [["Visits (consented)", visits], ["Waitlist", wl], ["Requests", reqs], ["Plans sent", sent], ["Plans approved", approved], ["Paid", paid], ["Jobs completed", done], ["Rated", rated]];
  void and;
  return (
    <div className="space-y-5"><H1 sub="The one metric is repeat rate">Analytics</H1>
      <div className="rounded-2xl border border-ink/20 bg-sun p-5"><div className="mono text-xs uppercase">Repeat rate (customers with 2+ paid plans)</div><div className="display text-6xl">{Math.round(repeat * 100)}%</div><div className="text-sm">{customers.filter((c) => Number(c.n) >= 2).length} of {customers.length} paying customers. Pilot is small, treat this as a direction, not a verdict.</div></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Tile label="GMV" value={inr(gmv)} /><Tile label="Take rate" value={`${Math.round(take * 100)}%`} /><Tile label="Completion rate" value={`${done + canc ? Math.round((done / (done + canc)) * 100) : 0}%`} /><Tile label="NPS" value={nps} hint={`${rs.length} ratings`} /></div>
      <section><h2 className="display mb-2 text-xl">Funnel</h2><div className="space-y-1">{funnel.map(([l, v]) => <div key={l} className="flex items-center gap-2"><span className="w-40 text-xs">{l}</span><div className="h-6 rounded bg-euc" style={{ width: `${Math.max(2, (v / Math.max(1, funnel[0][1])) * 100)}%` }} /><b className="mono text-xs">{v}</b></div>)}</div></section>
      <div className="grid gap-4 md:grid-cols-2"><section><h2 className="display text-xl">Waitlist by society</h2><Table cols={["Society", "Neighbours"]} rows={bySoc.map((b) => [b.s, Number(b.n)])} /></section><section><h2 className="display text-xl">Waitlist growth by week</h2><Table cols={["Week of", "Signups"]} rows={wk.map((w) => [w.w, Number(w.n)])} /></section></div></div>
  );
}
