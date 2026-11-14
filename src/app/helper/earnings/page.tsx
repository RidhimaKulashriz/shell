import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { tasks, reviews, payouts } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { formatINR } from "@/lib/pricing";
import { fmtDate } from "@/lib/utils";
import { ActionButton } from "@/components/client";
import { EmptyState } from "@/components/ui";
export const metadata = { title: "Earnings" };
export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const user = await requireRole(["HELPER"], "/helper/earnings");
  const range = (await searchParams).r ?? "week";
  const done = await db.select().from(tasks).where(and(eq(tasks.helperId, user.id), eq(tasks.status, "approved"))).orderBy(desc(tasks.approvedAt));
  const tips = await db.select().from(reviews).where(eq(reviews.toUserId, user.id));
  const tipOf = (id: string) => tips.find((r) => r.taskId === id)?.tip ?? 0;
  const days = range === "today" ? 1 : range === "week" ? 7 : 30; const since = Date.now() - days * 864e5;
  const inRange = done.filter((t) => t.approvedAt && t.approvedAt.getTime() >= (range === "today" ? new Date().setHours(0, 0, 0, 0) : since));
  const total = inRange.reduce((s, t) => s + t.helperPayout + (t.expense?.approved ?? 0) + tipOf(t.id), 0);
  const avail = done.filter((t) => !t.paidOut); const availAmt = avail.reduce((s, t) => s + t.helperPayout + (t.expense?.approved ?? 0) + tipOf(t.id), 0);
  const hist = await db.select().from(payouts).where(eq(payouts.helperId, user.id)).orderBy(desc(payouts.createdAt)).limit(10);
  const fee = Math.max(500, Math.round(availAmt * 0.02));
  return (<div className="space-y-6"><h1 className="text-3xl font-semibold text-tide">Earnings</h1>
    <div className="flex gap-2">{[["today", "Today"], ["week", "This week"], ["month", "This month"]].map(([v, l]) => <a key={v} href={`/helper/earnings?r=${v}`} className={`chip ${range === v ? "on" : ""}`}>{l}</a>)}</div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-tide p-5 text-cream"><div className="text-xs uppercase tracking-wider text-sage">Earned</div><div className="serif text-4xl font-bold">{formatINR(total)}</div><div className="text-sm text-sage">{inRange.length} jobs, including tips</div></div>
      <div className="rounded-2xl bg-cream p-5"><div className="text-xs uppercase tracking-wider text-euca">Available to withdraw</div><div className="serif text-4xl font-bold text-tide">{formatINR(availAmt)}</div>
        <div className="mt-3 flex flex-wrap gap-2"><ActionButton url="/api/helper" body={{ action: "payout" }} disabled={!availAmt} className="btn btn-primary btn-sm" success="Payout sent">Instant payout (fee {formatINR(fee)})</ActionButton></div><p className="mt-2 text-xs text-ink/60">Or wait for the free weekly payout on Monday.</p></div></div>
    <section><h2 className="mb-3 text-xl font-semibold">Per-job breakdown</h2>{inRange.length === 0 ? <EmptyState icon="wallet" title="No earnings in this period." note="Complete a job to see it here." /> : <div className="card divide-y divide-line">{inRange.map((t) => <div key={t.id} className="flex items-center justify-between p-4 text-sm"><div><div className="font-semibold">{t.title}</div><div className="text-xs text-ink/50">{fmtDate(t.approvedAt)}{t.paidOut ? " · paid out" : " · available"}</div></div><div className="text-right" style={{ fontFamily: "var(--font-mono)" }}>{formatINR(t.helperPayout)}{tipOf(t.id) > 0 && <div className="text-xs text-euca">+ {formatINR(tipOf(t.id))} tip</div>}{(t.expense?.approved ?? 0) > 0 && <div className="text-xs text-ink/50">+ {formatINR(t.expense!.approved)} reimbursed</div>}</div></div>)}</div>}</section>
    <section><h2 className="mb-3 text-xl font-semibold">Payout history</h2>{hist.length === 0 ? <p className="text-sm text-ink/50">No payouts yet.</p> : <div className="card divide-y divide-line">{hist.map((p) => <div key={p.id} className="flex justify-between p-4 text-sm"><span>{fmtDate(p.createdAt)} · {p.method}</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatINR(p.amount)} <span className="text-xs text-ink/50">{p.utr}</span></span></div>)}</div>}</section>
    <p className="text-xs text-ink/50">Tax statements are available monthly. PAN is required once your yearly earnings cross the TDS threshold.</p></div>);
}
