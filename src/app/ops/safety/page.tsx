import Link from "next/link";
import { db } from "@/db";
import { sosEvents, users, taskEvents, tasks } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { OpsAction } from "@/components/ops";
import { fmtDateTime } from "@/lib/utils";
export const metadata = { title: "Ops: Safety" };
export default async function Page() {
  const s = await db.select().from(sosEvents).orderBy(desc(sosEvents.createdAt)).limit(30);
  const us = await db.select().from(users); const nm = (id: string) => us.find((u) => u.id === id);
  const an = await db.select({ e: taskEvents, t: tasks.title }).from(taskEvents).innerJoin(tasks, eq(tasks.id, taskEvents.taskId)).where(inArray(taskEvents.type, ["gps_anomaly", "otp_failed"])).orderBy(desc(taskEvents.createdAt)).limit(20);
  return (<div className="space-y-6"><h1 className="text-3xl font-semibold text-tide">Safety console</h1>
    <section className="space-y-3">{s.length === 0 && <p className="text-ink/50">No SOS alerts. Good.</p>}{s.map((x) => <div key={x.id} className={`card p-4 ${x.status === "open" ? "border-2 border-danger bg-[#fdf1ef]" : ""}`}><div className="flex flex-wrap items-center justify-between gap-2"><div><span className={`pill ${x.status === "open" ? "pill-bad" : ""}`}>{x.status}</span> <span className="pill">{x.kind}</span><div className="mt-1 font-semibold">{nm(x.userId)?.name} <span className="font-normal text-ink/60">{nm(x.userId)?.phone}</span></div>{x.taskId && <Link href={`/ops/jobs/${x.taskId}`} className="text-sm underline">Open job</Link>}</div>
      <div className="flex gap-2">{x.status === "open" && <OpsAction body={{ action: "sos_status", id: x.id, status: "acknowledged" }} className="btn btn-danger btn-sm">Acknowledge</OpsAction>}{x.status !== "resolved" && <OpsAction body={{ action: "sos_status", id: x.id, status: "resolved" }} confirm="Mark this SOS resolved?">Resolve</OpsAction>}</div></div>
      <ol className="mt-3 space-y-1 text-sm">{x.timeline.map((t, i) => <li key={i}><span className="text-xs text-ink/50">{fmtDateTime(t.at)}</span> · {t.text}</li>)}</ol>
      <p className="mt-2 text-xs text-ink/60">Response checklist: call the user, call the guard desk, call the trusted contact, log the outcome, file a post-incident report.</p></div>)}</section>
    <section><h2 className="mb-2 text-xl font-semibold">Geofence and check-in anomalies</h2><div className="card divide-y divide-line">{an.map(({ e, t }) => <div key={e.id} className="flex justify-between p-3 text-sm"><span><Link href={`/ops/jobs/${e.taskId}`} className="font-medium underline">{t}</Link> · {e.note}</span><span className="text-xs text-ink/50">{fmtDateTime(e.createdAt)}</span></div>)}{an.length === 0 && <p className="p-3 text-sm text-ink/50">None.</p>}</div></section></div>);
}
