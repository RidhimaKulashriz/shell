import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { tasks, taskEvents, messages, ledgerEntries, locationPings, users, plans, payments } from "@/db/schema";
import { asc, eq, or } from "drizzle-orm";
import { fmtDateTime } from "@/lib/utils";
import { formatINR } from "@/lib/pricing";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [t] = await db.select().from(tasks).where(eq(tasks.id, id)); if (!t) notFound();
  const ev = await db.select().from(taskEvents).where(eq(taskEvents.taskId, id)).orderBy(asc(taskEvents.createdAt));
  const msgs = await db.select().from(messages).where(eq(messages.threadKey, `task:${id}`)).orderBy(asc(messages.createdAt));
  const pings = await db.select().from(locationPings).where(eq(locationPings.taskId, id)).orderBy(asc(locationPings.ts)).limit(200);
  const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId)); const pay = await db.select().from(payments).where(eq(payments.planId, t.planId));
  const led = await db.select().from(ledgerEntries).where(or(eq(ledgerEntries.refId, id), ...pay.map((p) => eq(ledgerEntries.refId, p.id)))).orderBy(asc(ledgerEntries.createdAt));
  const us = await db.select().from(users); const nm = (x?: string | null) => us.find((u) => u.id === x)?.name ?? "—";
  const lats = pings.map((p) => p.lat), lngs = pings.map((p) => p.lng); const minLa = Math.min(...lats), maxLa = Math.max(...lats), minLn = Math.min(...lngs), maxLn = Math.max(...lngs);
  const path = pings.map((p) => `${20 + ((p.lng - minLn) / Math.max(1e-6, maxLn - minLn)) * 360},${180 - ((p.lat - minLa) / Math.max(1e-6, maxLa - minLa)) * 160}`).join(" ");
  return (<div className="space-y-5"><Link href="/ops/jobs" className="text-sm font-semibold underline">← Jobs</Link><h1 className="text-3xl font-semibold text-tide">{t.title}</h1>
    <p className="text-ink/60">Customer {nm(t.customerId)} · Helper {nm(t.helperId)} · {fmtDateTime(t.scheduledStart)} · {formatINR(t.price)} · <span className="pill">{t.status}</span></p>
    <div className="grid gap-5 lg:grid-cols-2"><div className="card p-4"><h2 className="font-semibold">Timeline</h2><ol className="mt-3 space-y-2 border-l-2 border-dashed border-line pl-4 text-sm">{ev.map((e) => <li key={e.id}><span className="font-medium">{e.note || e.type}</span><div className="text-xs text-ink/50">{fmtDateTime(e.createdAt)}{e.type === "gps_anomaly" || e.type === "otp_failed" ? " · flagged" : ""}</div></li>)}</ol></div>
      <div className="card p-4"><h2 className="font-semibold">Route replay</h2>{pings.length > 1 ? <svg viewBox="0 0 400 200" className="mt-2 w-full rounded-xl bg-forest"><polyline points={path} fill="none" stroke="#f2c318" strokeWidth="3" strokeLinejoin="round" /><circle cx={path.split(" ")[0].split(",")[0]} cy={path.split(" ")[0].split(",")[1]} r="5" fill="#daf1de" /></svg> : <p className="mt-2 text-sm text-ink/50">No location pings stored. Tracking runs only while a helper is on an active job, with consent. Pings are deleted after 30 days.</p>}<p className="mt-2 text-xs text-ink/50">Access to location data is audit-logged.</p></div>
      <div className="card p-4"><h2 className="font-semibold">Chat transcript</h2><ul className="mt-2 space-y-2 text-sm">{msgs.map((m) => <li key={m.id} className={m.leakFlags.length ? "rounded bg-[#f8dcd8] p-2" : ""}><strong>{nm(m.senderId)}:</strong> {m.body}{m.leakFlags.length > 0 && <span className="ml-2 pill pill-bad">{m.leakFlags.join(", ")}</span>}</li>)}{msgs.length === 0 && <li className="text-ink/50">No messages.</li>}</ul></div>
      <div className="card p-4"><h2 className="font-semibold">Payments and ledger</h2><p className="text-sm text-ink/60">Plan total {formatINR(plan.total)} · fee share {formatINR(t.feeShare)} · helper payout {formatINR(t.helperPayout)}</p><table className="mt-2 w-full text-xs"><tbody>{led.map((l) => <tr key={l.id} className="border-t border-line"><td className="py-1">{l.account}</td><td style={{ fontFamily: "var(--font-mono)" }}>{l.debit ? "Dr " + formatINR(l.debit) : "Cr " + formatINR(l.credit)}</td><td className="text-ink/50">{l.memo}</td></tr>)}</tbody></table></div>
      <div className="card p-4"><h2 className="font-semibold">Photos</h2><div className="mt-2 flex flex-wrap gap-2">{[...t.beforePhotos, ...t.afterPhotos].map((p, i) => <img key={i} src={p} alt={`Job photo ${i + 1}`} className="h-24 w-24 rounded-lg object-cover" />)}{t.beforePhotos.length + t.afterPhotos.length === 0 && <p className="text-sm text-ink/50">No photos uploaded.</p>}</div></div></div></div>);
}
