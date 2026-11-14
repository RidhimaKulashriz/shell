import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { plans, tasks } from "@/db/schema";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { EmptyState } from "@/components/ui";
import { formatINR } from "@/lib/pricing";
import { fmtDate } from "@/lib/utils";
export const metadata = { title: "Orders" };
export default async function Page({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const user = await requireRole(["CUSTOMER"], "/app/orders");
  const f = (await searchParams).f ?? "active";
  const ps = await db.select().from(plans).where(and(eq(plans.customerId, user.id), ne(plans.status, "superseded"))).orderBy(desc(plans.createdAt)).limit(40);
  const ts = ps.length ? await db.select().from(tasks).where(inArray(tasks.planId, ps.map((p) => p.id))) : [];
  const rows = ps.map((p) => { const t = ts.filter((x) => x.planId === p.id); const state = p.status !== "approved" ? "draft" : t.every((x) => x.status === "cancelled") ? "cancelled" : t.every((x) => ["approved", "cancelled"].includes(x.status)) ? "completed" : "active"; return { p, t, state }; });
  const list = rows.filter((r) => (f === "active" ? ["active", "draft"].includes(r.state) : r.state === f));
  return (<div><h1 className="text-3xl font-semibold text-tide">Orders</h1>
    <div className="mt-4 flex gap-2">{[["active", "Active"], ["completed", "Completed"], ["cancelled", "Cancelled"]].map(([v, l]) => <Link key={v} href={`/app/orders?f=${v}`} className={`chip ${f === v ? "on" : ""}`}>{l}</Link>)}</div>
    <div className="mt-5 space-y-3">{list.length === 0 && <EmptyState icon="receipt" title="Nothing here yet." note="It's peaceful. Enjoy it." />}
      {list.map(({ p, t, state }) => (<div key={p.id} className="card flex flex-wrap items-center gap-4 p-4"><Link href={p.status === "approved" || p.status === "sent" ? `/app/plans/${p.id}` : "/app"} className="min-w-0 flex-1"><div className="font-semibold">{p.title}</div><div className="text-sm text-ink/60">{fmtDate(p.createdAt)} · {t.length} task{t.length > 1 ? "s" : ""} · {state === "draft" ? (p.status === "sent" ? "Waiting for your approval" : "Being reviewed") : state}</div></Link>
        <strong style={{ fontFamily: "var(--font-mono)" }}>{formatINR(p.total)}</strong><Link href={`/app/new?text=${encodeURIComponent(p.title)}`} className="btn btn-ghost btn-sm">Rebook</Link></div>))}</div></div>);
}
