import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { expenses, ledgerEntries, payments, payouts, helpers, tasks } from "@/db/schema";
import { Badge, H1, Table, Tile } from "@/components/ops/ui";
import { ledgerBalanceCheck } from "@/lib/money";
import { fmtDateTime, inr } from "@/lib/format";

export const metadata = { title: "Finance" };

export default async function Page() {
  const [acc, bal, pays, pos, ex, recent] = await Promise.all([
    db.select({ a: ledgerEntries.account, d: sql<number>`sum(${ledgerEntries.debit})`, c: sql<number>`sum(${ledgerEntries.credit})` }).from(ledgerEntries).groupBy(ledgerEntries.account),
    ledgerBalanceCheck(),
    db.select().from(payments).orderBy(desc(payments.createdAt)),
    db.select({ p: payouts, h: helpers.displayName }).from(payouts).innerJoin(helpers, eq(helpers.id, payouts.helperId)).orderBy(desc(payouts.createdAt)).limit(20),
    db.select({ e: expenses, t: tasks.name }).from(expenses).innerJoin(tasks, eq(tasks.id, expenses.taskId)),
    db.select().from(ledgerEntries).orderBy(desc(ledgerEntries.ts)).limit(20),
  ]);
  const get = (a: string) => { const r = acc.find((x) => x.a === a); return r ? Number(r.c) - Number(r.d) : 0; };
  const captured = pays.filter((p) => p.status === "captured");
  const gmv = captured.reduce((s, p) => s + p.amount + p.creditsUsed, 0);
  const cashIn = acc.find((x) => x.a === "customer_cash");
  const mismatch = Number(cashIn?.d ?? 0) - Number(cashIn?.c ?? 0) !== captured.reduce((s, p) => s + p.amount, 0) - 0;
  return (
    <div className="space-y-5"><H1 sub="Double-entry ledger in integer paise. Every journal balances to zero.">Finance</H1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Tile label="GMV (captured)" value={inr(gmv)} /><Tile label="Platform revenue" value={inr(get("platform_revenue"))} tone="sage" /><Tile label="Helper payable" value={inr(get("helper_payable"))} /><Tile label="GST payable" value={inr(get("tax_payable"))} /></div>
      <p className={`rounded-xl p-2 text-sm font-bold ${bal.balanced ? "bg-sage" : "bg-brick text-cream"}`}>Ledger {bal.balanced ? "balanced" : "UNBALANCED"}: debits {inr(bal.debit)} = credits {inr(bal.credit)}{mismatch ? " · Razorpay reconciliation mismatch flagged: review payments" : " · Razorpay reconciliation: no mismatches"}</p>
      <section><h2 className="display text-xl">Accounts</h2><Table cols={["Account", "Debit", "Credit", "Net"]} rows={acc.map((a) => [a.a, inr(Number(a.d)), inr(Number(a.c)), inr(Number(a.c) - Number(a.d))])} /></section>
      <section><h2 className="display text-xl">Payments</h2><Table cols={["Order", "Method", "Amount", "Credits", "Status", "Webhooks"]} rows={pays.map((p) => [p.orderId.slice(-12), p.method ?? "-", inr(p.amount), inr(p.creditsUsed), <Badge key="s">{p.status}</Badge>, p.webhookEvents.length])} /></section>
      <section><h2 className="display text-xl">Payout queue</h2><Table cols={["Helper", "Amount", "Method", "Status", "UTR"]} rows={pos.map(({ p, h }) => [h, inr(p.amount), p.method, <Badge key="s">{p.status}</Badge>, p.utr ?? "-"])} /></section>
      <section><h2 className="display text-xl">Expense wallet audit</h2><Table cols={["Task", "Cap", "Spent", "Approved", "Refunded", "Status"]} rows={ex.map(({ e, t }) => [t, inr(e.cap), inr(e.spent), inr(e.approvedAmount), inr(e.refundedAmount), e.status])} /></section>
      <section><h2 className="display text-xl">Recent journal lines</h2><Table cols={["When", "Account", "Debit", "Credit", "Memo"]} rows={recent.map((l) => [fmtDateTime(l.ts), l.account, inr(l.debit), inr(l.credit), l.memo])} /></section>
      <p className="text-xs opacity-70">GST invoice: generated per plan from captured payments. Export for the accountant: copy the tables above (CSV export lands with the finance role permissions).</p></div>
  );
}
