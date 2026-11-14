import { db } from "@/db";
import * as S from "@/db/schema";
import { count, eq, sql, inArray, and } from "drizzle-orm";
import { formatINR } from "@/lib/pricing";
export const metadata = { title: "Ops: Analytics" };
export default async function Page() {
  const n = async (q: Promise<{ n: number }[]>) => (await q)[0].n;
  const waitlist = await n(db.select({ n: count() }).from(S.waitlist));
  const reqs = await n(db.select({ n: count() }).from(S.requests));
  const sent = await n(db.select({ n: count() }).from(S.plans).where(inArray(S.plans.status, ["sent", "approved"])));
  const paid = await n(db.select({ n: count() }).from(S.plans).where(eq(S.plans.status, "approved")));
  const done = await n(db.select({ n: count() }).from(S.tasks).where(eq(S.tasks.status, "approved")));
  const rated = await n(db.select({ n: count() }).from(S.reviews));
  const cancelled = await n(db.select({ n: count() }).from(S.tasks).where(eq(S.tasks.status, "cancelled")));
  const allTasks = await n(db.select({ n: count() }).from(S.tasks));
  const perCust = await db.select({ c: S.plans.customerId, n: count() }).from(S.plans).where(eq(S.plans.status, "approved")).groupBy(S.plans.customerId);
  const repeat = perCust.length ? perCust.filter((x) => x.n >= 2).length / perCust.length : 0;
  const pay = await db.select({ amt: sql<number>`coalesce(sum(${S.payments.amount} + ${S.payments.creditsUsed} + ${S.payments.walletUsed}),0)::int` }).from(S.payments).where(eq(S.payments.status, "captured"));
  const rev = await db.select({ r: sql<number>`coalesce(sum(${S.ledgerEntries.credit}),0)::int` }).from(S.ledgerEntries).where(eq(S.ledgerEntries.account, "platform_revenue"));
  const managed = await db.select({ n: count() }).from(S.plans).where(and(eq(S.plans.status, "approved"), sql`${S.plans.coordinationFee} > 0`));
  const circ = await db.select({ n: count() }).from(S.plans).where(and(eq(S.plans.status, "approved"), sql`${S.plans.circleId} is not null`));
  const rate = await db.select({ avg: sql<number>`coalesce(avg(${S.reviews.rating}),0)::float` }).from(S.reviews);
  const gmv = pay[0].amt; const take = gmv ? rev[0].r / gmv : 0; const aov = paid ? gmv / paid : 0;
  const funnel = [["Waitlist", waitlist], ["Requests", reqs], ["Plan sent", sent], ["Plan approved and paid", paid], ["Completed jobs", done], ["Rated", rated]];
  const max = Math.max(...funnel.map((f) => Number(f[1])), 1);
  return (<div className="space-y-6"><h1 className="text-3xl font-semibold text-tide">Analytics</h1>
    <div className="rounded-3xl bg-tide p-6 text-cream"><div className="text-xs uppercase tracking-widest text-sage">The one metric</div><div className="serif text-6xl font-bold">{Math.round(repeat * 100)}%</div><div className="text-sage">Repeat rate: customers with 2 or more paid plans ({perCust.filter((x) => x.n >= 2).length} of {perCust.length}).</div></div>
    <section className="card p-5"><h2 className="font-semibold">Funnel</h2><div className="mt-3 space-y-2">{funnel.map(([l, v]) => <div key={String(l)} className="flex items-center gap-3 text-sm"><span className="w-44 shrink-0">{l}</span><div className="h-6 flex-1 rounded bg-line"><div className="h-6 rounded bg-euca" style={{ width: `${(Number(v) / max) * 100}%` }} /></div><span className="w-10 text-right font-semibold">{v}</span></div>)}</div></section>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[["GMV", formatINR(gmv)], ["Net revenue", formatINR(rev[0].r)], ["Take rate", `${(take * 100).toFixed(1)}%`], ["Average order", formatINR(aov)], ["Managed share", `${paid ? Math.round((managed[0].n / paid) * 100) : 0}%`], ["Circle share", `${paid ? Math.round((circ[0].n / paid) * 100) : 0}%`], ["Completion rate", `${allTasks ? Math.round((done / allTasks) * 100) : 0}%`], ["Cancellation rate", `${allTasks ? Math.round((cancelled / allTasks) * 100) : 0}%`], ["Average rating", rate[0].avg.toFixed(2)]].map(([l, v]) => <div key={l} className="card p-4"><div className="text-xs font-semibold uppercase tracking-wider text-ink/50">{l}</div><div className="serif text-3xl font-bold">{v}</div></div>)}</div>
    <p className="text-xs text-ink/50">GMV and revenue come from the ledger. Seed jobs are demo data. Website events are collected after cookie consent.</p></div>);
}
