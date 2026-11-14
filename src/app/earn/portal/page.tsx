import Link from "next/link";
import { and, eq, gte, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { addresses, helpers, offers, plans, taskTemplates, tasks, towers } from "@/db/schema";
import { OfferCard, OnlineToggle, type OfferV } from "@/components/earn/Portal";
import { Countdown } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { haversine } from "@/lib/geo";
import { inr, fmtDateTime } from "@/lib/format";

export const metadata = { title: "Home" };
const LEVELS: [string, number][] = [["STARTER", 11], ["TRUSTED", 41], ["PRO", 121], ["ELITE", Infinity]];

export default async function Page() {
  const user = await requireUser(["HELPER"], "/earn/login");
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user.id)).limit(1);
  const active = h.status === "active";
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const [os, mine, done] = await Promise.all([
    db.select().from(offers).where(and(eq(offers.helperId, h.id), eq(offers.status, "sent"))),
    db.select().from(tasks).where(and(eq(tasks.assignedHelperId, h.id), ne(tasks.status, "cancelled"), ne(tasks.status, "approved"))).orderBy(tasks.scheduledStart),
    db.select().from(tasks).where(and(eq(tasks.assignedHelperId, h.id), eq(tasks.status, "approved"), gte(tasks.approvedAt, dayStart))),
  ]);
  const ts = os.length ? await db.select().from(tasks).where(inArray(tasks.id, os.map((o) => o.taskId))) : [];
  const pl = ts.length ? await db.select().from(plans).where(inArray(plans.id, ts.map((t) => t.planId))) : [];
  const ad = await db.select().from(addresses).where(inArray(addresses.id, pl.map((p) => p.addressId).filter(Boolean) as string[]).valueOf() as never).catch(() => []);
  void ad;
  const allAddr = await db.select().from(addresses);
  const tw = await db.select().from(towers);
  const tpl = await db.select().from(taskTemplates);
  const offerViews: OfferV[] = os.flatMap((o) => {
    const t = ts.find((x) => x.id === o.taskId); if (!t) return [];
    const p = pl.find((x) => x.id === t.planId); const a = allAddr.find((x) => x.id === p?.addressId);
    const d = h.lat != null && a?.lat != null ? Math.round(haversine({ lat: h.lat, lng: h.lng! }, { lat: a.lat, lng: a.lng! })) : 400;
    void tpl;
    return [{ id: o.id, task: t.name, payout: o.payout, minutes: t.durationEstMin, tower: `${tw.find((x) => x.id === a?.towerId)?.name ?? "Tower"}, floor ${a?.floor ?? "-"}`, distanceM: d, start: t.scheduledStart?.toISOString() ?? null, expiresAt: o.expiresAt?.toISOString() ?? null, rush: t.isRush, notes: p?.managed ? "Part of a Managed plan" : "", breakdown: o.breakdown }];
  });
  const next = mine[0];
  const idx = LEVELS.findIndex(([l]) => l === h.level);
  const target = LEVELS[idx]?.[1] ?? Infinity;
  const todayTotal = done.reduce((s, t) => s + t.helperPayout, 0);
  return (
    <div className="space-y-5">
      {!active && <div className="rounded-2xl border border-ink/20 bg-sand p-4"><b className="display text-xl">Status: {h.status}</b><p className="text-sm">{h.status === "review" ? "Your documents are under review." : h.status === "training" || h.status === "shadow" ? "Complete your training, starting with the safety module." : "Complete your application."}</p><Link href="/earn/apply" className="link-quiet font-bold">Status tracker</Link></div>}
      <OnlineToggle online={h.online} rush={h.rushOptIn} circle={h.circleOptIn} active={active} />
      <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl border border-ink/20 bg-paper p-2"><div className="mono text-xl">{inr(todayTotal)}</div><div className="text-xs">aaj</div></div><div className="rounded-xl border border-ink/20 bg-paper p-2"><div className="mono text-xl">{h.jobsDone}</div><div className="text-xs">jobs</div></div><div className="rounded-xl border border-ink/20 bg-paper p-2"><div className="mono text-xl">{h.ratingAvg.toFixed(1)}</div><div className="text-xs">rating</div></div></div>
      <div><div className="flex justify-between text-sm"><b>{h.level}</b><span className="mono">{h.jobsDone}/{Number.isFinite(target) ? target : "max"} jobs</span></div><div className="mt-1 h-3 overflow-hidden rounded-full border border-ink/20 bg-paper"><div className="h-full bg-sun" style={{ width: `${Number.isFinite(target) ? Math.min(100, (h.jobsDone / target) * 100) : 100}%` }} /></div><p className="text-xs">Acceptance {Math.round(h.acceptanceRate * 100)}% · On-time {Math.round(h.onTimeRate * 100)}%</p></div>
      {next && <Link href={`/earn/portal/jobs/${next.id}`} className="block rounded-2xl border border-ink/20 bg-forest p-4 text-cream shadow-[0_22px_44px_-30px_rgba(5,31,32,0.6)]"><div className="mono text-xs uppercase text-sage">Next job</div><b className="display text-2xl">{next.name}</b><p className="text-sm">{fmtDateTime(next.scheduledStart)} {next.scheduledStart && <>· <Countdown to={next.scheduledStart} prefix="in " /></>}</p></Link>}
      <section><h2 className="display text-2xl">Offers</h2><div className="mt-2 space-y-3">{offerViews.length === 0 && <p className="hand text-xl opacity-70">No offers right now.</p>}{offerViews.map((o) => <OfferCard key={o.id} o={o} />)}</div></section>
      {mine.length > 1 && <section><h2 className="display text-2xl">Today's jobs</h2>{mine.slice(1).map((t) => <Link key={t.id} href={`/earn/portal/jobs/${t.id}`} className="mt-2 flex justify-between rounded-xl border border-ink/20 bg-paper p-3"><span>{t.name}</span><span className="mono text-xs">{t.status}</span></Link>)}</section>}
    </div>
  );
}
