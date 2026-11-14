import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customerProfiles, expenses, payments, plans, referrals, tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { inr, fmtDateTime } from "@/lib/format";

export const metadata = { title: "Wallet" };

export default async function Page() {
  const user = await requireUser(["CUSTOMER"]);
  const [[p], pays, refs, ex] = await Promise.all([
    db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id)).limit(1),
    db.select().from(payments).where(eq(payments.customerId, user.id)).orderBy(desc(payments.createdAt)),
    db.select().from(referrals).where(eq(referrals.referrerId, user.id)),
    db.select({ e: expenses, t: tasks.name }).from(expenses).innerJoin(tasks, eq(tasks.id, expenses.taskId)).innerJoin(plans, eq(plans.id, tasks.planId)).where(eq(plans.customerId, user.id)),
  ]);
  return (
    <div className="space-y-5">
      <h1 className="display text-3xl">Wallet aur Credits</h1>
      <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border-2 border-ink bg-paper p-4"><div className="mono text-xs uppercase">Wallet</div><div className="display text-3xl">{inr(p?.walletBalance ?? 0)}</div></div><div className="rounded-2xl border-2 border-ink bg-sand p-4"><div className="mono text-xs uppercase">Credits</div><div className="display text-3xl">{inr(p?.creditsBalance ?? 0)}</div><p className="text-xs">Credits pehle lagte hain.</p></div></div>
      <section className="receipt scallop-b"><h2 className="display text-lg">Ledger</h2><div className="perf" />{pays.length === 0 && <p>Abhi kuch nahi.</p>}{pays.map((x) => <div key={x.id} className="receipt-line"><span>Plan payment<span className="block text-[11px] opacity-60">{fmtDateTime(x.createdAt)} · {x.status}{x.creditsUsed ? ` · credits ${inr(x.creditsUsed)}` : ""}</span></span><span className="leader" /><span>-{inr(x.amount)}</span></div>)}{ex.map(({ e, t }) => e.refundedAmount > 0 && <div key={e.id} className="receipt-line"><span>Refund: unused on {t}<span className="block text-[11px] opacity-60">Expense cap {inr(e.cap)}, spent {inr(e.approvedAmount)}</span></span><span className="leader" /><span>+{inr(e.refundedAmount)}</span></div>)}</section>
      <section className="rounded-2xl border-2 border-ink bg-paper p-4"><h2 className="display text-xl">Referrals</h2><p className="mono">Your code: <b>{p?.referralCode}</b></p><p className="text-sm">{refs.length} invited, {refs.filter((r) => r.rewardPaid).length} rewarded. Dono ko credit milta hai.</p><ul className="mt-1 text-sm">{refs.map((r) => <li key={r.id}>{r.status}{r.rewardPaid ? " (rewarded)" : ""}</li>)}</ul></section>
    </div>
  );
}
