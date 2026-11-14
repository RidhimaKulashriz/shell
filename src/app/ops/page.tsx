import { and, count, desc, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { disputes, helpers, plans, requests, societies, sosEvents, taskEvents, tasks, towers } from "@/db/schema";
import { PulseMap } from "@/components/maps";
import { Act } from "@/components/ops/Actions";
import { H1, Table, Tile } from "@/components/ops/ui";
import { Countdown } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "Today" };

export default async function Page() {
  const n = async (q: Promise<{ n: number }[]>) => Number((await q)[0].n);
  const [live, unassigned, review, risk, openDisp, sos, pay, online] = await Promise.all([
    n(db.select({ n: count() }).from(tasks).where(inArray(tasks.status, ["en_route", "arrived", "in_progress"]))),
    n(db.select({ n: count() }).from(requests).where(inArray(requests.status, ["new", "clarifying"]))),
    n(db.select({ n: count() }).from(requests).where(eq(requests.status, "in_review"))),
    n(db.select({ n: count() }).from(tasks).where(and(inArray(tasks.status, ["accepted", "offered", "planned"]), lt(tasks.scheduledStart, new Date())))),
    n(db.select({ n: count() }).from(disputes).where(inArray(disputes.status, ["open", "under_review", "awaiting_info"]))),
    db.select().from(sosEvents).where(inArray(sosEvents.status, ["open", "acknowledged"])),
    n(db.select({ n: count() }).from(plans).where(eq(plans.status, "sent"))),
    n(db.select({ n: count() }).from(helpers).where(eq(helpers.online, true))),
  ]);
  const [soc] = await db.select().from(societies).where(eq(societies.status, "pilot")).limit(1);
  const tw = soc ? await db.select().from(towers).where(eq(towers.societyId, soc.id)) : [];
  const hs = await db.select().from(helpers).where(eq(helpers.online, true));
  const ev = await db.select().from(taskEvents).orderBy(desc(taskEvents.ts)).limit(50);
  return (
    <div className="space-y-5"><H1 sub="Live view of the pilot society">Today</H1>
      {sos.length > 0 && <div className="rounded-xl border-2 border-ink bg-brick p-3 text-cream"><b className="display text-xl">SOS ACTIVE ({sos.length})</b>{sos.map((s) => <div key={s.id} className="mt-1 flex items-center justify-between gap-2"><span>{s.kind} · {fmtDateTime(s.createdAt)} · {s.status}</span><span className="flex gap-1"><Act url={`/api/ops/sos/${s.id}`} body={{ action: "ack" }} label="Acknowledge" variant="btn-cream" /><Act url={`/api/ops/sos/${s.id}`} body={{ action: "resolve" }} ask="Resolution note" label="Resolve" variant="btn-cream" /></span></div>)}</div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Tile label="Live jobs" value={live} tone="sage" /><Tile label="Unassigned requests" value={unassigned} tone={unassigned ? "sand" : "paper"} /><Tile label="Plans to review" value={review} tone={review ? "sand" : "paper"} hint="SLA 15 min" /><Tile label="At-risk jobs" value={risk} tone={risk ? "red" : "paper"} /><Tile label="Open disputes" value={openDisp} /><Tile label="SOS" value={sos.length} tone={sos.length ? "red" : "paper"} /><Tile label="Payments pending" value={pay} /><Tile label="Helpers online" value={online} /></div>
      <div className="grid gap-4 lg:grid-cols-2"><div><h2 className="display mb-2 text-xl">Live map</h2><PulseMap boundary={soc?.boundary ?? []} gates={soc?.gates ?? []} towers={tw.map((t) => ({ name: t.name, lat: t.lat, lng: t.lng }))} helpers={hs.filter((h) => h.lat != null).map((h) => ({ id: h.id, name: h.displayName, lat: h.lat!, lng: h.lng!, label: h.displayName.split(" ")[0] }))} className="border-2 border-ink" /></div>
        <div><h2 className="display mb-2 text-xl">Last 50 events</h2><div className="max-h-[420px] overflow-auto"><Table cols={["When", "Event"]} rows={ev.map((e) => [fmtDateTime(e.ts), <span key={e.id}>{e.kind.replace(/_/g, " ")}</span>])} /></div></div></div>
      <div className="rounded-xl border-2 border-dashed border-ink p-3 text-sm"><b>Shift handover:</b> {unassigned + review} requests waiting, {risk} at-risk jobs. Next review SLA due <Countdown to={new Date(Date.now() + 11 * 60000)} />.</div>
    </div>
  );
}
