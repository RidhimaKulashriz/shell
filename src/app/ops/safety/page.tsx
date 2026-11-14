import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { geofenceEvents, sosEvents, users } from "@/db/schema";
import { Act } from "@/components/ops/Actions";
import { Badge, H1, Table } from "@/components/ops/ui";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "Safety console" };

export default async function Page() {
  const sos = await db.select({ s: sosEvents, u: users.name, ph: users.phone }).from(sosEvents).innerJoin(users, eq(users.id, sosEvents.userId)).orderBy(desc(sosEvents.createdAt));
  const geo = await db.select().from(geofenceEvents).orderBy(desc(geofenceEvents.ts)).limit(20);
  return (
    <div className="space-y-5"><H1 sub="SOS escalates here within 20 seconds. Every action is timestamped.">Safety console</H1>
      {sos.map(({ s, u, ph }) => (
        <div key={s.id} className={`rounded-xl border border-ink/20 p-3 ${s.status === "resolved" ? "bg-cream" : "bg-brick/15"}`}><div className="flex flex-wrap items-center justify-between gap-2"><b className="display text-xl">{u} ({ph})</b><span className="flex gap-2"><Badge tone={s.status === "open" ? "red" : "ink"}>{s.status}</Badge><Badge>{s.kind}</Badge></span></div>
          {s.points[0] && <p className="mono text-xs">Last location {s.points[s.points.length - 1].lat.toFixed(5)}, {s.points[s.points.length - 1].lng.toFixed(5)}</p>}
          <ol className="mt-1 list-decimal pl-5 text-sm">{s.timeline.map((t, i) => <li key={i}>{fmtDateTime(t.ts)}: {t.text}</li>)}</ol>
          <p className="mt-1 text-xs">Response checklist: call customer · call helper · call guard · notify trusted contact · post-incident report</p>
          {s.status !== "resolved" && <div className="mt-2 flex gap-2"><Act url={`/api/ops/sos/${s.id}`} body={{ action: "ack" }} label="Acknowledge" /><Act url={`/api/ops/sos/${s.id}`} body={{ action: "resolve" }} ask="Resolution / report" label="Resolve" variant="btn-sun" /></div>}{s.report && <p className="mt-1 text-xs">Report: {s.report}</p>}</div>
      ))}
      {sos.length === 0 && <p className="hand text-2xl">No active SOS alerts.</p>}
      <section><h2 className="display text-xl">Geofence events</h2><Table cols={["When", "Fence", "Event"]} rows={geo.map((g) => [fmtDateTime(g.ts), g.geofenceType, g.event])} /></section></div>
  );
}
