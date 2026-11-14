import Link from "next/link";
import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { fmtDateTime, STATUS_LABEL } from "@/lib/utils";
import { formatINR } from "@/lib/pricing";
export const metadata = { title: "Ops: Jobs" };
export default async function Page({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const s = (await searchParams).s;
  const rows = await db.select().from(tasks).where(s ? eq(tasks.status, s) : undefined).orderBy(desc(tasks.createdAt)).limit(100);
  const us = await db.select().from(users); const nm = (id?: string | null) => us.find((u) => u.id === id)?.name ?? "";
  return (<div><h1 className="text-3xl font-semibold text-tide">Jobs</h1><div className="mt-3 flex flex-wrap gap-2">{["", "offered", "accepted", "en_route", "in_progress", "awaiting_approval", "approved", "cancelled"].map((x) => <Link key={x} href={x ? `/ops/jobs?s=${x}` : "/ops/jobs"} className={`chip ${(s ?? "") === x ? "on" : ""}`}>{x ? STATUS_LABEL[x] : "All"}</Link>)}</div>
    <div className="card mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-bone text-xs uppercase text-ink/50"><tr><th className="p-3">Task</th><th>Customer</th><th>Helper</th><th>When</th><th>Price</th><th>Status</th></tr></thead><tbody>{rows.map((t) => <tr key={t.id} className="border-t border-line"><td className="p-3 font-medium"><Link href={`/ops/jobs/${t.id}`} className="underline">{t.title}</Link></td><td>{nm(t.customerId)}</td><td>{nm(t.helperId) || "—"}</td><td>{fmtDateTime(t.scheduledStart)}</td><td style={{ fontFamily: "var(--font-mono)" }}>{formatINR(t.price)}</td><td><span className="pill">{STATUS_LABEL[t.status]}</span></td></tr>)}</tbody></table></div></div>);
}
