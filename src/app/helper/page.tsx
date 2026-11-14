import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { helperProfiles, offers, tasks, categories, addresses, plans, requests, towers, users, reviews } from "@/db/schema";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { OnlineToggle, ApplyWizard, StatusTracker } from "@/components/helper";
import { ActionButton } from "@/components/client";
import { EmptyState } from "@/components/ui";
import { formatDuration, formatINR } from "@/lib/pricing";
import { haversine } from "@/lib/geo";
import { fmtDateTime, STATUS_LABEL } from "@/lib/utils";
import { LEVELS } from "@/lib/tasks";
export const metadata = { title: "Helper home" };

export default async function Page() {
  const user = await requireRole(["HELPER"], "/helper");
  const [h] = await db.select().from(helperProfiles).where(eq(helperProfiles.userId, user.id));
  if (["applied"].includes(h.status) && h.applicationStep <= 7) return (<div><h1 className="mb-1 text-3xl font-semibold text-tide">Earn while you study.</h1><p className="mb-6 text-ink/60">Estimates only, not guarantees. Complete your application to start earning.</p><ApplyWizard start={h.applicationStep} name={user.name} saved={h.application} /></div>);
  if (h.status !== "active") return (
    <div className="mx-auto max-w-xl space-y-5"><h1 className="text-3xl font-semibold text-tide">{h.status === "review" ? "Application submitted" : h.status === "training" ? "Almost there. Finish training." : `Account ${h.status}`}</h1>
      <div className="card p-5"><StatusTracker status={h.status} /></div>
      {h.status === "review" && <p className="text-ink/70">Our team is reviewing your documents, usually within one working day. We&apos;ll notify you.</p>}
      {h.status === "training" && <Link href="/helper/training" className="btn btn-primary">Start the safety module</Link>}
      {["suspended", "banned", "paused"].includes(h.status) && <p className="text-ink/70">Please contact support to understand why and how to appeal.</p>}</div>);
  const myOffers = await db.select().from(offers).where(and(eq(offers.helperId, user.id), eq(offers.status, "sent")));
  const offerTasks = myOffers.length ? await db.select().from(tasks).where(inArray(tasks.id, myOffers.map((o) => o.taskId))) : [];
  const cats = await db.select().from(categories);
  const detail = async (taskId: string) => { const t = offerTasks.find((x) => x.id === taskId)!; const [p] = await db.select().from(plans).where(eq(plans.id, t.planId)); const [r] = await db.select().from(requests).where(eq(requests.id, p.requestId)); const [a] = r.addressId ? await db.select().from(addresses).where(eq(addresses.id, r.addressId)) : []; const [tw] = a ? await db.select().from(towers).where(eq(towers.id, a.towerId)) : []; return { t, tw, a }; };
  const cards = await Promise.all(myOffers.map(async (o) => ({ o, ...(await detail(o.taskId)) })));
  const mine = await db.select().from(tasks).where(and(eq(tasks.helperId, user.id), inArray(tasks.status, ["accepted", "en_route", "arrived", "in_progress", "rework", "awaiting_approval"]))).orderBy(tasks.scheduledStart);
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const [today] = await db.select({ s: sql<number>`coalesce(sum(${tasks.helperPayout}),0)::int` }).from(tasks).where(and(eq(tasks.helperId, user.id), eq(tasks.status, "approved"), gte(tasks.approvedAt, startOfDay)));
  const lvl = LEVELS.findIndex((l) => l.name === h.level); const nextLvl = LEVELS[lvl + 1];
  const [rv] = await db.select({ n: sql<number>`count(*)::int` }).from(reviews).where(eq(reviews.toUserId, user.id));
  void users; void desc;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold text-tide">Hi {user.name.split(" ")[0]}</h1><p className="text-ink/60">Earn on your own time.</p></div><div className="text-right"><div className="text-xs uppercase tracking-wider text-ink/50">Earned today</div><div className="serif text-3xl font-bold">{formatINR(today.s)}</div></div></div>
      <OnlineToggle online={h.online} rush={h.rushOptIn} active />
      <div className="grid gap-3 sm:grid-cols-3"><div className="card p-4"><div className="text-xs text-ink/50">Rating</div><div className="serif text-2xl font-bold">{h.ratingAvg ? h.ratingAvg.toFixed(1) : "New"}</div><div className="text-xs text-ink/50">{rv.n} reviews</div></div><div className="card p-4"><div className="text-xs text-ink/50">On-time rate</div><div className="serif text-2xl font-bold">{Math.round(h.onTimeRate * 100)}%</div></div>
        <div className="card p-4"><div className="text-xs text-ink/50">Level: {h.level[0] + h.level.slice(1).toLowerCase()}</div>{nextLvl ? <><div className="mt-2 h-2 overflow-hidden rounded-full bg-line"><div className="h-full bg-euca" style={{ width: `${Math.min(100, (h.jobsDone / nextLvl.min) * 100)}%` }} /></div><div className="mt-1 text-xs text-ink/50">{Math.max(0, nextLvl.min - h.jobsDone)} jobs to {nextLvl.label}</div></> : <div className="mt-2 text-xs">Top level reached</div>}</div></div>

      {mine.length > 0 && <section><h2 className="mb-3 text-xl font-semibold">Your jobs</h2><div className="space-y-3">{mine.map((t) => <Link key={t.id} href={`/helper/jobs/${t.id}`} className="card flex items-center justify-between gap-3 p-4 hover:border-euca"><div><div className="font-semibold">{t.title}</div><div className="text-sm text-ink/60">{fmtDateTime(t.scheduledStart)} · {formatDuration(t.durationEstMin)}</div></div><div className="text-right"><span className={`pill ${t.status === "in_progress" ? "" : "pill-warn"}`}>{STATUS_LABEL[t.status]}</span><div className="mt-1 text-sm font-semibold">{formatINR(t.helperPayout)}</div></div></Link>)}</div></section>}

      <section><h2 className="mb-3 text-xl font-semibold">Offers for you</h2>
        {!h.online && cards.length === 0 && <EmptyState icon="phone" title="You're offline." note="Go online to receive offers." />}
        {h.online && cards.length === 0 && <EmptyState icon="bicycle" title="No offers right now." note="Stay online. We'll send the next one the moment it matches you." />}
        <div className="space-y-3">{cards.map(({ o, t, tw, a }) => { const cat = cats.find((c) => c.id === t.categoryId); const dist = a && tw ? 0 : 0; void dist; void haversine; return (
          <div key={o.id} className="card p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="flex items-center gap-2"><h3 className="text-lg font-semibold">{t.title}</h3>{t.rush && <span className="pill pill-bad">Rush</span>}</div><p className="text-sm text-ink/60">{tw?.name}, floor {a?.floor} · {formatDuration(t.durationEstMin)} · {cat?.unit} × {t.quantity}</p><p className="text-sm text-ink/60">{fmtDateTime(t.scheduledStart)}</p></div><div className="text-right"><div className="text-xs text-ink/50">You earn</div><div className="serif text-2xl font-bold text-euca">{formatINR(o.payout)}</div></div></div>
            <div className="mt-3 flex gap-2"><ActionButton url={`/api/tasks/${t.id}/accept`} className="btn btn-primary" success="Accepted. Open the job for details.">Accept</ActionButton><ActionButton url={`/api/tasks/${t.id}/decline`} body={{ reason: "not_available" }} className="btn btn-ghost">Decline</ActionButton></div></div>); })}</div>
        <details className="mt-4 text-sm text-ink/70"><summary className="cursor-pointer font-semibold underline">How offers are chosen</summary><p className="mt-2">We offer jobs to the best-matching helpers first, scoring skill, distance, rating, on-time rate, whether you&apos;ve helped that customer before, and whether the job fits a trip you&apos;re already making. First to accept gets the job.</p></details></section>
    </div>
  );
}
