import Link from "next/link";
import { db } from "@/db";
import * as S from "@/db/schema";
import { and, count, desc, eq, inArray, lt, isNull, or, sql } from "drizzle-orm";
import { SocietyMap } from "@/components/ui";
import { Handover } from "@/components/ops";
import { OpsAction } from "@/components/ops";
import { getSetting } from "@/lib/settings";
import { fmtDateTime, timeAgo } from "@/lib/utils";
export const metadata = { title: "Ops: Today" };
export default async function Page() {
  const c = async (q: Promise<{ n: number }[]>) => (await q)[0].n;
  const live = await c(db.select({ n: count() }).from(S.tasks).where(inArray(S.tasks.status, ["accepted", "en_route", "arrived", "in_progress", "rework"])));
  const unassigned = await db.select().from(S.tasks).where(and(inArray(S.tasks.status, ["planned", "offered"]), isNull(S.tasks.helperId)));
  const paidUnassigned = [];
  for (const t of unassigned) { const [p] = await db.select().from(S.plans).where(and(eq(S.plans.id, t.planId), eq(S.plans.status, "approved"))); if (p) paidUnassigned.push(t); }
  const review = await c(db.select({ n: count() }).from(S.requests).where(eq(S.requests.status, "in_review")));
  const soon = new Date(Date.now() + 30 * 60000);
  const atRisk = await db.select().from(S.tasks).where(or(and(inArray(S.tasks.status, ["accepted"]), lt(S.tasks.scheduledStart, soon)), and(inArray(S.tasks.status, ["awaiting_approval"]), lt(S.tasks.checkOutAt, new Date(Date.now() - 3600000)))));
  const disputes = await c(db.select({ n: count() }).from(S.disputes).where(inArray(S.disputes.status, ["open", "under_review", "awaiting_info"])));
  const sos = await db.select().from(S.sosEvents).where(eq(S.sosEvents.status, "open"));
  const pays = await c(db.select({ n: count() }).from(S.plans).where(eq(S.plans.status, "sent")));
  const online = await db.select({ h: S.helperProfiles, u: S.users }).from(S.helperProfiles).innerJoin(S.users, eq(S.users.id, S.helperProfiles.userId)).where(eq(S.helperProfiles.online, true));
  const [soc] = await db.select().from(S.societies).where(eq(S.societies.status, "pilot")).limit(1);
  const towers = soc ? await db.select().from(S.towers).where(eq(S.towers.societyId, soc.id)) : [];
  const events = await db.select({ e: S.taskEvents, t: S.tasks.title }).from(S.taskEvents).innerJoin(S.tasks, eq(S.tasks.id, S.taskEvents.taskId)).orderBy(desc(S.taskEvents.createdAt)).limit(15);
  const handover = await getSetting("handover", "");
  const Tile = ({ l, n, href, tone = "" }: { l: string; n: number; href: string; tone?: string }) => <Link href={href} className={`card p-4 hover:border-euca ${tone}`}><div className="text-xs font-semibold uppercase tracking-wider text-ink/50">{l}</div><div className="serif text-4xl font-bold">{n}</div></Link>;
  return (
    <div className="space-y-6"><h1 className="text-3xl font-semibold text-tide">Today</h1>
      {sos.length > 0 && <Link href="/ops/safety" className="block rounded-2xl bg-danger p-5 text-white"><div className="text-xs font-bold uppercase tracking-widest">SOS</div><div className="serif text-3xl font-bold">{sos.length} open SOS alert{sos.length > 1 ? "s" : ""}. Respond now.</div></Link>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Tile l="Live jobs" n={live} href="/ops/dispatch" /><Tile l="Unassigned (paid)" n={paidUnassigned.length} href="/ops/dispatch" tone={paidUnassigned.length ? "border-sun" : ""} /><Tile l="Plans to review" n={review} href="/ops/requests" /><Tile l="At-risk jobs" n={atRisk.length} href="/ops/jobs" tone={atRisk.length ? "border-danger" : ""} />
        <Tile l="Open disputes" n={disputes} href="/ops/disputes" /><Tile l="Awaiting payment" n={pays} href="/ops/requests" /><Tile l="Helpers online" n={online.length} href="/ops/helpers" /><Tile l="SOS open" n={sos.length} href="/ops/safety" /></div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="space-y-4">{soc && <div className="card p-4"><h2 className="mb-3 font-semibold">Live map: {soc.name}</h2><SocietyMap gates={soc.gates} towers={towers.map((t) => ({ name: t.name, lat: t.lat, lng: t.lng }))} boundary={soc.boundary} helper={null} />
        <p className="mt-2 text-xs text-ink/60">Online: {online.map((o) => o.u.name.split(" ")[0]).join(", ") || "nobody"}</p></div>}
        <div className="card p-4"><h2 className="mb-3 font-semibold">Latest events</h2><ul className="divide-y divide-line text-sm">{events.map(({ e, t }) => <li key={e.id} className="flex justify-between gap-3 py-2"><span><Link href={`/ops/jobs/${e.taskId}`} className="font-medium underline">{t}</Link> <span className="text-ink/60">{e.note || e.type}</span></span><span className="shrink-0 text-xs text-ink/40">{timeAgo(e.createdAt)}</span></li>)}</ul></div></div>
        <div className="space-y-4"><div className="card p-4"><h2 className="mb-2 font-semibold">Needs attention</h2>{[...paidUnassigned.map((t) => ({ t, why: "Paid, no helper yet" })), ...atRisk.map((t) => ({ t, why: t.status === "accepted" ? "Starts within 30 min, not on the way" : "Awaiting approval over 1 hour" }))].map(({ t, why }) => <div key={t.id} className="flex items-center justify-between gap-2 border-t border-line py-2 text-sm"><div><Link href={`/ops/jobs/${t.id}`} className="font-medium underline">{t.title}</Link><div className="text-xs text-ink/60">{why} · {fmtDateTime(t.scheduledStart)}</div></div>{!t.helperId && <OpsAction body={{ action: "task_reoffer", taskId: t.id }} success="Re-offered to top candidates">Re-offer</OpsAction>}</div>)}{paidUnassigned.length + atRisk.length === 0 && <p className="text-sm text-ink/50">Nothing at risk. Peaceful.</p>}</div>
          <div className="card p-4"><Handover initial={handover} /></div></div></div></div>
  );
}
