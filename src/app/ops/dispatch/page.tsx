import Link from "next/link";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { circles, helpers, tasks } from "@/db/schema";
import { Badge, H1 } from "@/components/ops/ui";
import { AssignForm } from "@/components/ops/Actions";
import { suggestHelpers } from "@/lib/dispatch";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "Dispatch" };
const COLS: [string, string[]][] = [["New", ["planned"]], ["Offered", ["offered"]], ["Accepted", ["accepted"]], ["On the way", ["en_route", "arrived"]], ["In progress", ["in_progress", "rework"]], ["Awaiting approval", ["awaiting_approval"]], ["Done", ["approved"]]];

export default async function Page() {
  const ts = await db.select().from(tasks).where(ne(tasks.status, "cancelled")).orderBy(tasks.scheduledStart);
  const hs = await db.select().from(helpers);
  const cs = await db.select().from(circles).where(inArray(circles.status, ["open", "filling", "confirmed", "full"]));
  const backup = hs.filter((h) => h.status === "active" && h.online);
  const sugg = new Map(await Promise.all(ts.filter((t) => ["planned", "offered"].includes(t.status)).map(async (t) => [t.id, await suggestHelpers(t.id, 4)] as const)));
  void and; void eq;
  return (
    <div><H1 sub="Kanban of every task. Drag-free: use Assign with a reason.">Dispatch board</H1>
      <div className="hide-scroll flex gap-3 overflow-x-auto pb-3">{COLS.map(([name, sts]) => { const list = ts.filter((t) => sts.includes(t.status)); return (
        <section key={name} className="w-64 shrink-0 rounded-xl border border-ink/20 bg-cream p-2"><h2 className="display mb-2 text-lg">{name} <span className="mono text-xs">{list.length}</span></h2>
          <div className="space-y-2">{list.map((t) => { const h = hs.find((x) => x.id === t.assignedHelperId); const s = sugg.get(t.id); return <div key={t.id} className="rounded-lg border border-ink/20 bg-paper p-2 text-xs"><Link href={`/ops/jobs/${t.id}`} className="font-bold underline">{t.name}</Link><div className="mono opacity-70">{fmtDateTime(t.scheduledStart)}</div><div>{h ? `Helper: ${h.displayName}` : "Unassigned"}</div>{t.scheduledStart && t.scheduledStart < new Date() && !["approved", "in_progress", "awaiting_approval"].includes(t.status) && <Badge tone="red">late</Badge>}{s && <div className="mt-1"><AssignForm taskId={t.id} helpers={s.filter((x) => x.eligible).map((x) => ({ id: x.helperId, name: x.name, score: x.score }))} /></div>}</div>; })}</div></section>); })}</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><section className="rounded-xl border border-ink/20 bg-cream p-3"><h2 className="display text-lg">Backup helper pool</h2><ul className="mt-2 text-sm">{backup.map((h) => <li key={h.id}>{h.displayName} · {h.level} · {h.ratingAvg.toFixed(1)}</li>)}</ul></section>
        <section className="rounded-xl border border-ink/20 bg-cream p-3"><h2 className="display text-lg">Circle batches</h2>{cs.map((c) => <div key={c.id} className="mt-2 rounded-lg bg-paper p-2 text-sm"><b>{c.title}</b> <Badge>{c.status}</Badge><div className="mono text-xs">{c.currentFlats}/{c.maxFlats} flats (min {c.minFlats}) · {fmtDateTime(c.windowStart)} · one dispatch</div></div>)}</section></div>
      <p className="mt-3 text-xs opacity-70">Automatic rules: unaccepted offers expire and re-offer to the next candidate; helpers more than 10 minutes late trigger an ops alert and a backup offer.</p></div>
  );
}
