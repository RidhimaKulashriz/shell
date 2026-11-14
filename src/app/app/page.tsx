import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { plans, tasks, customerProfiles, circles, addresses, packs, circleMembers } from "@/db/schema";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { Composer } from "@/components/customer";
import { ReadinessRing, EmptyState } from "@/components/ui";
import { planPercent } from "@/lib/progress";
import { circleDiscount, formatINR } from "@/lib/pricing";
import { packEstimate } from "@/lib/content";
import { fmtDateTime } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/utils";

export const metadata = { title: "Home" };
export default async function Page() {
  const user = await requireRole(["CUSTOMER"], "/app");
  const [active] = await db.select().from(plans).where(and(eq(plans.customerId, user.id), eq(plans.status, "approved"))).orderBy(desc(plans.createdAt)).limit(1);
  const pending = await db.select().from(plans).where(and(eq(plans.customerId, user.id), inArray(plans.status, ["sent", "draft"]))).orderBy(desc(plans.createdAt)).limit(1);
  const ts = active ? await db.select().from(tasks).where(eq(tasks.planId, active.id)) : [];
  const live = ts.length > 0 && ts.some((t) => !["approved", "cancelled", "failed"].includes(t.status));
  const [addr] = await db.select().from(addresses).where(eq(addresses.userId, user.id)).limit(1);
  const cs = await db.select().from(circles).where(and(eq(circles.towerId, addr.towerId), ne(circles.status, "cancelled"))).limit(3);
  const mine = await db.select().from(circleMembers).where(eq(circleMembers.userId, user.id));
  const pk = await db.select().from(packs).where(eq(packs.active, true)).orderBy(packs.displayOrder);
  const past = await db.select().from(plans).where(and(eq(plans.customerId, user.id), eq(plans.status, "approved"))).orderBy(desc(plans.createdAt)).limit(4);
  const [prof] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id));
  const hr = new Date().getUTCHours() + 5.5; const h = (hr % 24);
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-semibold text-tide">{greet}, {user.name.split(" ")[0]}.</h1><p className="text-ink/60">What can we take off your plate today?</p></div>
      <Composer />
      {pending[0] && <Link href={`/app/plans/${pending[0].id}`} className="flex items-center justify-between rounded-2xl border-2 border-sun bg-[#fff8dc] p-4"><div><div className="font-semibold">{pending[0].status === "sent" ? "Your plan is ready" : "A person is checking your plan"}</div><div className="text-sm text-ink/70">{pending[0].title}</div></div><span className="btn btn-primary btn-sm">{pending[0].status === "sent" ? "Review" : "View"}</span></Link>}
      {live && active ? (
        <Link href={`/app/plans/${active.id}`} className="card flex items-center gap-5 p-5 hover:border-euca"><ReadinessRing percent={planPercent(ts.map((t) => t.status))} deadline={active.deadlineAt} size={110} /><div><div className="text-xs font-bold uppercase tracking-wider text-euca">Active plan</div><h2 className="text-xl font-semibold">{active.title}</h2><p className="text-sm text-ink/60">{ts.filter((t) => t.status === "approved").length} of {ts.length} tasks done</p><p className="mt-1 text-sm font-semibold text-euca">{STATUS_LABEL[ts.find((t) => !["approved", "cancelled"].includes(t.status))?.status ?? "approved"]}</p></div></Link>
      ) : !pending[0] && <EmptyState icon="home" title="Nothing in progress." note="Peaceful. Enjoy it, or tell us what you need above." />}
      {cs.length > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-semibold">Neighbours in your tower</h2><Link href="/app/circles" className="text-sm font-semibold underline">All circles</Link></div>
        {cs.map((c) => <Link key={c.id} href="/app/circles" className="card mb-2 flex items-center justify-between p-4"><div><div className="font-semibold">{c.title}</div><div className="text-sm text-ink/60">{c.currentFlats} of {c.maxFlats} flats joined · {Math.round(circleDiscount(c.currentFlats) * 100)}% off</div></div><span className="btn btn-ghost btn-sm">{mine.some((m) => m.circleId === c.id) ? "Joined" : "Join"}</span></Link>)}</section>}
      <section><h2 className="mb-3 text-xl font-semibold">Ready-made packs</h2><div className="scroll-x -mx-4 flex gap-4 px-4 pb-3">{pk.map((p) => <Link key={p.slug} href={`/app/new?pack=${p.slug}`} className="ticket w-60 shrink-0 p-5"><p className="text-[0.65rem] font-bold tracking-[0.2em] text-euca">PACK</p><h3 className="text-lg font-semibold leading-tight text-tide">{p.name}</h3><p className="mt-1 text-xs text-ink/60">{p.tagline}</p><hr className="perf" /><div className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)" }}>from {formatINR(packEstimate(p.items).total)}</div></Link>)}</div></section>
      {past.length > 0 && <section><h2 className="mb-3 text-xl font-semibold">Book again</h2><div className="grid gap-3 sm:grid-cols-2">{past.map((p) => <Link key={p.id} href={`/app/new?text=${encodeURIComponent(p.title)}`} className="card flex items-center justify-between p-4 hover:border-euca"><div><div className="font-semibold">{p.title}</div><div className="text-xs text-ink/50">{fmtDateTime(p.createdAt)}</div></div><span className="btn btn-ghost btn-sm">Rebook</span></Link>)}</div></section>}
      <p className="text-xs text-ink/40">{prof?.creditsBalance ? `You have ${formatINR(prof.creditsBalance)} in credits.` : ""}</p>
    </div>
  );
}
