import Link from "next/link";
import { db } from "@/db";
import { messages, users, tasks, taskEvents } from "@/db/schema";
import { desc, eq, sql, count } from "drizzle-orm";
import { OpsAction } from "@/components/ops";
import { fmtDateTime } from "@/lib/utils";
export const metadata = { title: "Ops: Leakage and fraud" };
export default async function Page() {
  const hits = await db.select().from(messages).where(sql`array_length(${messages.leakFlags}, 1) > 0`).orderBy(desc(messages.createdAt)).limit(40);
  const us = await db.select().from(users); const nm = (id?: string | null) => us.find((u) => u.id === id);
  const cancels = await db.select({ h: taskEvents.actorId, n: count() }).from(taskEvents).where(eq(taskEvents.type, "helper_cancelled")).groupBy(taskEvents.actorId);
  const gps = await db.select({ n: count() }).from(taskEvents).where(eq(taskEvents.type, "gps_anomaly"));
  const pairs = await db.select({ c: tasks.customerId, h: tasks.helperId, n: count() }).from(tasks).where(eq(tasks.status, "approved")).groupBy(tasks.customerId, tasks.helperId).having(sql`count(*) >= 2`);
  return (<div className="space-y-6"><h1 className="text-3xl font-semibold text-tide">Leakage and fraud monitor</h1>
    <section><h2 className="mb-2 text-xl font-semibold">Chat scanner hits</h2><p className="mb-3 text-sm text-ink/60">Phone numbers (including spelled-out and Devanagari digits), UPI IDs, emails and social handles. Messages are blurred for the recipient and the sender is warned.</p>
      <div className="space-y-2">{hits.length === 0 && <p className="text-ink/50">No hits.</p>}{hits.map((m) => { const u = nm(m.senderId); return <div key={m.id} className="card flex flex-wrap items-center justify-between gap-3 p-3 text-sm"><div><span className="pill pill-bad">{m.leakFlags.join(", ")}</span> <strong>{u?.name}</strong> ({u?.role.toLowerCase()}) <span className="text-ink/60">{m.body}</span><div className="text-xs text-ink/50">{fmtDateTime(m.createdAt)} · <Link href={`/ops/jobs/${m.threadKey.split(":")[1]}`} className="underline">job</Link></div></div>
        <span className="flex gap-1">{u?.role === "HELPER" && <><OpsAction body={{ action: "helper_strike", id: m.senderId }} ask="Strike reason">Strike</OpsAction><OpsAction body={{ action: "helper_status", id: m.senderId, status: "suspended" }} ask="Reason">Suspend</OpsAction></>}</span></div>; })}</div></section>
    <div className="grid gap-5 md:grid-cols-3"><div className="card p-4"><h3 className="font-semibold">Helper cancellations</h3><ul className="mt-2 text-sm">{cancels.map((c) => <li key={c.h} className="flex justify-between"><span>{nm(c.h)?.name}</span><span className="pill">{c.n}</span></li>)}{cancels.length === 0 && <li className="text-ink/50">None</li>}</ul></div>
      <div className="card p-4"><h3 className="font-semibold">GPS spoof flags</h3><div className="serif text-4xl font-bold">{gps[0].n}</div><p className="text-xs text-ink/60">Mock location, impossible speed, low accuracy.</p></div>
      <div className="card p-4"><h3 className="font-semibold">Repeat pairings (2+ jobs)</h3><ul className="mt-2 text-sm">{pairs.map((p, i) => <li key={i}>{nm(p.c)?.name} and {nm(p.h)?.name}: {p.n}</li>)}{pairs.length === 0 && <li className="text-ink/50">None</li>}</ul><p className="mt-2 text-xs text-ink/50">Review for pairs that stop booking through Shell.</p></div></div></div>);
}
