import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { plans, tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { inr, fmtDate } from "@/lib/format";
import { readinessPct } from "@/lib/statemachine";

export const metadata = { title: "Orders" };

export default async function Page({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const user = await requireUser(["CUSTOMER"]);
  const f = (await searchParams).f ?? "active";
  const ps = await db.select().from(plans).where(eq(plans.customerId, user.id)).orderBy(desc(plans.createdAt));
  const ts = await db.select().from(tasks);
  const rows = ps.map((p) => { const mine = ts.filter((t) => t.planId === p.id); const pct = readinessPct(mine.map((t) => t.status)); return { p, pct, done: pct === 100 }; }).filter(({ p, done }) => (f === "active" ? ["approved", "sent"].includes(p.status) && !done : f === "completed" ? done : p.status === "rejected" || p.status === "superseded"));
  return (
    <div className="space-y-4">
      <h1 className="display text-3xl">Orders</h1>
      <div className="flex gap-2">{["active", "completed", "cancelled"].map((x) => <Link key={x} href={`/app/orders?f=${x}`} className="chip capitalize" aria-pressed={f === x}>{x}</Link>)}</div>
      {rows.length === 0 && <p className="hand py-10 text-center text-2xl">Nothing here yet.</p>}
      {rows.map(({ p, pct }) => <div key={p.id} className="rounded-2xl border border-ink/20 bg-paper p-4"><div className="flex justify-between"><b className="display text-xl">{p.title}</b><span className="mono">{inr(p.total)}</span></div><div className="mono text-xs opacity-70">{fmtDate(p.createdAt)} · {p.status === "sent" ? "plan ready" : `${pct}% ready`}</div><div className="mt-3 flex gap-2"><Link href={p.status === "sent" ? `/app/plans/${p.id}` : `/app/orders/${p.id}`} className="btn btn-forest btn-sm">Dekho</Link><Link href={`/app?text=${encodeURIComponent(p.title)}`} className="btn btn-cream btn-sm" onClick={undefined}>Rebook</Link></div></div>)}
    </div>
  );
}
