import { db } from "@/db";
import { ledgerEntries, payments, payouts, tasks } from "@/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import { formatINR } from "@/lib/pricing";
import { fmtDateTime } from "@/lib/utils";
export const metadata = { title: "Ops: Finance" };
export default async function Page() {
  const acc = await db.select({ a: ledgerEntries.account, d: sql<number>`sum(${ledgerEntries.debit})::int`, c: sql<number>`sum(${ledgerEntries.credit})::int` }).from(ledgerEntries).groupBy(ledgerEntries.account);
  const totalD = acc.reduce((s, x) => s + x.d, 0), totalC = acc.reduce((s, x) => s + x.c, 0);
  const unb = await db.select({ j: ledgerEntries.journalId }).from(ledgerEntries).groupBy(ledgerEntries.journalId).having(sql`sum(${ledgerEntries.debit}) <> sum(${ledgerEntries.credit})`);
  const pays = await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(15); const po = await db.select().from(payouts).orderBy(desc(payouts.createdAt)).limit(10);
  const capTasks = await db.select().from(tasks).where(sql`${tasks.expensesCap} > 0`).limit(20);
  const bal = (n: string) => { const a = acc.find((x) => x.a === n); return a ? a.c - a.d : 0; };
  const gmv = pays.filter((p) => p.status === "captured").reduce((s, p) => s + p.amount + p.creditsUsed + p.walletUsed, 0);
  void eq;
  return (<div className="space-y-6"><h1 className="text-3xl font-semibold text-tide">Finance</h1>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[["Platform revenue (net of GST)", bal("platform_revenue")], ["GST payable", bal("tax_payable")], ["Helper payable (unpaid)", bal("helper_payable")], ["Held in escrow", bal("escrow")]].map(([l, v]) => <div key={String(l)} className="card p-4"><div className="text-xs font-semibold uppercase tracking-wider text-ink/50">{l}</div><div className="serif text-3xl font-bold">{formatINR(Number(v))}</div></div>)}</div>
    <div className={`rounded-2xl p-4 text-sm ${unb.length || totalD !== totalC ? "bg-[#f8dcd8]" : "bg-cream"}`}>Ledger check: debits {formatINR(totalD)} · credits {formatINR(totalC)} · {unb.length === 0 && totalD === totalC ? "every journal balances to zero" : `${unb.length} unbalanced journals!`}</div>
    <section><h2 className="mb-2 text-xl font-semibold">Ledger by account</h2><div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-bone text-xs uppercase text-ink/50"><tr><th className="p-3">Account</th><th>Debit</th><th>Credit</th><th>Balance (Cr − Dr)</th></tr></thead><tbody>{acc.map((x) => <tr key={x.a} className="border-t border-line"><td className="p-3 font-medium">{x.a}</td><td style={{ fontFamily: "var(--font-mono)" }}>{formatINR(x.d)}</td><td style={{ fontFamily: "var(--font-mono)" }}>{formatINR(x.c)}</td><td style={{ fontFamily: "var(--font-mono)" }}>{formatINR(x.c - x.d)}</td></tr>)}</tbody></table></div></section>
    <div className="grid gap-5 lg:grid-cols-2"><section><h2 className="mb-2 text-xl font-semibold">Payments (Razorpay reconciliation)</h2><div className="card divide-y divide-line text-sm">{pays.map((p) => <div key={p.id} className="flex justify-between p-3"><span>{p.orderId}<div className="text-xs text-ink/50">{fmtDateTime(p.createdAt)} · {p.method}</div></span><span className="text-right" style={{ fontFamily: "var(--font-mono)" }}>{formatINR(p.amount)}<div className="text-xs text-ink/50">{p.status} · matched</div></span></div>)}</div><p className="mt-1 text-xs text-ink/50">Captured GMV in view: {formatINR(gmv)}</p></section>
      <section><h2 className="mb-2 text-xl font-semibold">Payouts</h2><div className="card divide-y divide-line text-sm">{po.map((p) => <div key={p.id} className="flex justify-between p-3"><span>{p.method} · {p.utr}<div className="text-xs text-ink/50">{fmtDateTime(p.createdAt)}</div></span><span style={{ fontFamily: "var(--font-mono)" }}>{formatINR(p.amount)} <span className="text-xs text-ink/50">fee {formatINR(p.fee)}</span></span></div>)}{po.length === 0 && <p className="p-3 text-ink/50">No payouts yet.</p>}</div>
        <h2 className="mb-2 mt-6 text-xl font-semibold">Expense wallet audit</h2><div className="card divide-y divide-line text-sm">{capTasks.map((t) => <div key={t.id} className="flex justify-between p-3"><span>{t.title}</span><span style={{ fontFamily: "var(--font-mono)" }}>cap {formatINR(t.expensesCap)} · spent {formatINR(t.expense?.spent ?? 0)} · refunded {formatINR(t.expense?.refunded ?? 0)}</span></div>)}</div></section></div></div>);
}
