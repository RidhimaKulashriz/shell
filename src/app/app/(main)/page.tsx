import Link from "next/link";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { circleMembers, circles, notifications, plans, requests, taskTemplates, tasks } from "@/db/schema";
import { HomeComposer } from "@/components/app/Composer";
import { Icon } from "@/components/Icon";
import { Countdown, Ring } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { readinessPct } from "@/lib/statemachine";
import { packCards } from "@/lib/site-data";
import { inr } from "@/lib/format";
import { activePricing } from "@/lib/data";
import { circleDiscount } from "@/lib/pricing";

export const metadata = { title: "Home" };

function greet() {
  const h = Number(new Date().toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }));
  return h < 5 ? "Working late?" : h < 12 ? "Good morning. What can we take off your list?" : h < 17 ? "Good afternoon. We will handle it." : h < 21 ? "Good evening. Relax, we will handle it." : "Good evening. Tell us what tomorrow needs.";
}

export default async function Home({ searchParams }: { searchParams: Promise<{ text?: string; pack?: string; task?: string }> }) {
  const user = await requireUser(["CUSTOMER"]);
  const sp = await searchParams;
  const [myPlans, reqs, packs, cfg, unread] = await Promise.all([
    db.select().from(plans).where(eq(plans.customerId, user.id)).orderBy(desc(plans.createdAt)).limit(10),
    db.select().from(requests).where(and(eq(requests.customerId, user.id), inArray(requests.status, ["new", "clarifying", "in_review"]))).orderBy(desc(requests.createdAt)).limit(3),
    packCards(), activePricing(),
    db.select({ id: notifications.id }).from(notifications).where(and(eq(notifications.userId, user.id), eq(notifications.type, "circle_invite"))),
  ]);
  const active = myPlans.find((p) => p.status === "approved" && p.deadlineAt && p.deadlineAt > new Date(Date.now() - 6 * 3600000));
  const activeTasks = active ? await db.select().from(tasks).where(eq(tasks.planId, active.id)) : [];
  const waiting = myPlans.find((p) => p.status === "sent");
  const past = await db.select({ slug: tasks.templateSlug, name: taskTemplates.nameEn }).from(tasks).innerJoin(plans, eq(plans.id, tasks.planId)).innerJoin(taskTemplates, eq(taskTemplates.slug, tasks.templateSlug)).where(and(eq(plans.customerId, user.id), eq(tasks.status, "approved")));
  const rebook = [...new Map(past.map((p) => [p.slug, p])).values()].slice(0, 4);
  const [circle] = await db.select().from(circles).where(and(ne(circles.status, "cancelled"))).orderBy(desc(circles.createdAt)).limit(1);
  const joined = circle ? (await db.select().from(circleMembers).where(and(eq(circleMembers.circleId, circle.id), eq(circleMembers.userId, user.id)))).length > 0 : false;
  const prefill = sp.text ?? (sp.pack ? packs.find((p) => p.slug === sp.pack)?.name + ": " + packs.find((p) => p.slug === sp.pack)?.tasks.join(", ") : sp.task ? `${rebookName(sp.task)}` : "");
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between"><h1 className="display text-3xl">Namaste, {user.name.split(" ")[0] || "dost"}</h1><Link href="/app/notifications" className="chip" aria-label="Notifications"><Icon name="bell" size={20} tone="none" />{unread.length || ""}</Link></header>
      <HomeComposer prefill={prefill} greeting={greet()} />

      {reqs.map((r) => (
        <Link key={r.id} href={`/app/request/${r.id}`} className="block rounded-2xl border border-dashed border-ink/20 bg-paper p-4">
          <div className="mono text-xs uppercase opacity-60">Plan in progress</div>
          <p className="mt-1 line-clamp-2 font-semibold">{r.rawText}</p>
          <p className="mt-1 text-sm">{r.status === "clarifying" ? "We need your answers" : <>A person is reviewing it. Plan <Countdown to={r.slaDueAt ?? new Date()} prefix="in " /></>}</p>
        </Link>
      ))}
      {waiting && <Link href={`/app/plans/${waiting.id}`} className="block rotate-[-0.6deg] rounded-2xl border border-ink/20 bg-sun p-4 shadow-[0_22px_44px_-30px_rgba(5,31,32,0.6)]"><div className="mono text-xs uppercase">Plan ready</div><b className="display text-2xl">{waiting.title}</b><p>Your plan is ready. Please take a look. {inr(waiting.total)}</p></Link>}
      {active && (
        <Link href={`/app/orders/${active.id}`} className="flex items-center gap-4 rounded-2xl border border-ink/20 bg-forest p-4 text-cream shadow-[0_22px_44px_-30px_rgba(5,31,32,0.6)]">
          <Ring pct={readinessPct(activeTasks.map((t) => t.status))} size={112} tone="cream" />
          <div><div className="mono text-xs uppercase text-sage">Live</div><b className="display text-2xl">{active.title}</b><p className="text-sm">Deadline <b><Countdown to={active.deadlineAt!} prefix="in " /></b></p></div>
        </Link>
      )}

      <section aria-labelledby="packs-h"><h2 id="packs-h" className="display text-2xl">Packs</h2>
        <div className="hide-scroll -mx-4 mt-2 flex gap-3 overflow-x-auto px-4 pb-2">{packs.map((p) => <Link key={p.slug} href={`/app?pack=${p.slug}`} className="ticket w-44 shrink-0 border border-ink/20 p-3"><Icon name={p.icon} size={34} /><b className="display mt-1 block leading-tight">{p.name}</b><span className="mono text-xs">from {inr(p.from)}</span></Link>)}</div></section>

      {circle && (
        <Link href="/app/circle" className="block rounded-2xl border border-ink/20 bg-sage p-4"><div className="mono text-xs uppercase">Shell Circle</div><b className="display text-xl">{circle.title}: {circle.currentFlats} of {circle.maxFlats} flats joined</b><div className="mt-2 h-3 overflow-hidden rounded-full border border-ink/20 bg-paper"><div className="h-full bg-forest" style={{ width: `${(circle.currentFlats / circle.maxFlats) * 100}%` }} /></div><p className="mt-1 text-sm">{joined ? "You have joined." : "Join"} Price per flat: {inr(Math.round(circle.basePrice * (1 - circleDiscount(circle.currentFlats, cfg))))}</p></Link>
      )}
      {rebook.length > 0 && <section><h2 className="display text-2xl">Dobara karwao</h2><div className="mt-2 grid grid-cols-2 gap-3">{rebook.map((r) => <Link key={r.slug} href={`/app?task=${r.slug}`} className="rounded-2xl border border-ink/20 bg-paper p-3 font-bold">{r.name}</Link>)}</div></section>}
      {!active && !waiting && !reqs.length && <p className="hand text-center text-2xl">Nothing here yet.</p>}
    </div>
  );
}
function rebookName(slug: string) { return slug.replace(/-/g, " "); }
