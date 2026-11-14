import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { helpers, payouts, reviews, tasks } from "@/db/schema";
import { PayoutButton } from "@/components/earn/Portal";
import { requireUser } from "@/lib/auth";
import { inr, fmtDate } from "@/lib/format";

export const metadata = { title: "Earnings" };

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const user = await requireUser(["HELPER"], "/earn/login");
  const range = (await searchParams).r ?? "week";
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user.id)).limit(1);
  const since = new Date(); since.setDate(since.getDate() - (range === "today" ? 0 : range === "week" ? 7 : 30)); if (range === "today") since.setHours(0, 0, 0, 0);
  const [jobs, pays, tips] = await Promise.all([db.select().from(tasks).where(and(eq(tasks.assignedHelperId, h.id), eq(tasks.status, "approved"), gte(tasks.approvedAt, since))).orderBy(desc(tasks.approvedAt)), db.select().from(payouts).where(eq(payouts.helperId, h.id)).orderBy(desc(payouts.createdAt)), db.select().from(reviews).where(eq(reviews.toUserId, user.id))]);
  const total = jobs.reduce((s, t) => s + t.helperPayout, 0);
  const pending = pays.filter((p) => p.status === "scheduled").reduce((s, p) => s + p.amount, 0);
  const tipSum = tips.reduce((s, r) => s + r.tipAmount, 0);
  return (
    <div className="space-y-5"><h1 className="display text-3xl">Earnings</h1>
      <div className="flex gap-2">{["today", "week", "month"].map((r) => <a key={r} href={`?r=${r}`} className="chip capitalize" aria-pressed={range === r}>{r}</a>)}</div>
      <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border-2 border-ink bg-sage p-4"><div className="mono text-xs uppercase">{range}</div><div className="display text-3xl">{inr(total)}</div></div><div className="rounded-2xl border-2 border-ink bg-paper p-4"><div className="mono text-xs uppercase">Available</div><div className="display text-3xl">{inr(pending)}</div>{h.payoutHold && <p className="text-xs font-bold text-brick">Payouts on hold</p>}</div></div>
      <PayoutButton pending={h.payoutHold ? 0 : pending} />
      <section className="receipt scallop-b"><h2 className="display text-lg">Per-job</h2><div className="perf" />{jobs.length === 0 && <p>Is range mein koi job nahi.</p>}{jobs.map((t) => <div key={t.id} className="receipt-line"><span>{t.name}<span className="block text-[11px] opacity-60">{fmtDate(t.approvedAt)} · base {inr(t.helperPayout)}</span></span><span className="leader" /><span>{inr(t.helperPayout)}</span></div>)}<div className="perf" /><div className="receipt-line"><span>Tips (100% yours)</span><span className="leader" /><span>{inr(tipSum)}</span></div></section>
      <section><h2 className="display text-2xl">Payout history</h2>{pays.map((p) => <div key={p.id} className="mt-2 flex justify-between rounded-xl bg-paper p-3 text-sm"><span>{fmtDate(p.createdAt)} · {p.method}{p.utr ? ` · ${p.utr}` : ""}</span><span className="mono">{inr(p.amount)} <span className="stamp ml-1">{p.status}</span></span></div>)}</section>
      <p className="text-xs opacity-70">Tax statements: TDS is applied where required by law. PAN is requested once payouts cross the threshold.</p></div>
  );
}
