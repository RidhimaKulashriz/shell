import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { customerProfiles, payments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatINR } from "@/lib/pricing";
import { fmtDateTime } from "@/lib/utils";
import { ActionButton } from "@/components/client";
import { CopyButton } from "@/components/order";
import { EmptyState } from "@/components/ui";
export const metadata = { title: "Wallet" };
export default async function Page() {
  const user = await requireRole(["CUSTOMER"], "/app/wallet");
  const [p] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id));
  const pays = await db.select().from(payments).where(eq(payments.userId, user.id)).orderBy(desc(payments.createdAt)).limit(20);
  return (<div className="space-y-6"><h1 className="text-3xl font-semibold text-tide">Wallet and credits</h1>
    <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-tide p-5 text-cream"><div className="text-xs uppercase tracking-wider text-sage">Shell Wallet</div><div className="serif text-4xl font-bold">{formatINR(p?.walletBalance ?? 0)}</div><p className="mt-1 text-sm text-sage">Refunds from unspent expense caps land here.</p><ActionButton url="/api/me/topup" body={{ amount: 500 }} className="btn btn-light btn-sm mt-3" success="₹500 added (demo)">Add ₹500</ActionButton></div>
      <div className="rounded-2xl bg-cream p-5"><div className="text-xs uppercase tracking-wider text-euca">Credits</div><div className="serif text-4xl font-bold text-tide">{formatINR(p?.creditsBalance ?? 0)}</div><p className="mt-1 text-sm text-ink/70">Applied first at checkout. Earned from referrals.</p></div></div>
    <div className="card p-5"><h2 className="font-semibold">Refer a neighbour</h2><p className="text-sm text-ink/60">You both get credits when they complete their first job.</p><div className="mt-3 flex flex-wrap items-center gap-3"><code className="rounded bg-bone px-3 py-2" style={{ fontFamily: "var(--font-mono)" }}>{p?.referralCode}</code><CopyButton text={`/waitlist?ref=${p?.referralCode}`} /></div></div>
    <section><h2 className="mb-3 text-xl font-semibold">Payments</h2>{pays.length === 0 ? <EmptyState icon="wallet" title="No payments yet." /> : <div className="card divide-y divide-line">{pays.map((x) => <div key={x.id} className="flex items-center justify-between p-4 text-sm"><div><div className="font-semibold">Plan payment</div><div className="text-xs text-ink/50">{fmtDateTime(x.createdAt)} · {x.method.toUpperCase()} · {x.status}</div></div><div style={{ fontFamily: "var(--font-mono)" }}>{formatINR(x.amount)}{x.creditsUsed ? <span className="block text-xs text-ink/50">+ {formatINR(x.creditsUsed)} credits</span> : null}</div></div>)}</div>}</section></div>);
}
