import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { circles, circleMembers, addresses, users, tasks } from "@/db/schema";
import { and, desc, eq, ne, count, inArray } from "drizzle-orm";
import { CircleCard, CircleCreate } from "@/components/customer";
import { EmptyState } from "@/components/ui";
import { circleDiscount } from "@/lib/pricing";
import { fmtDateTime } from "@/lib/utils";
import { joinCircle } from "@/lib/requests";
export const metadata = { title: "Circles" };
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ join?: string }> }) {
  const user = await requireRole(["CUSTOMER"], "/app/circles");
  const sp = await searchParams;
  if (sp.join) await joinCircle(sp.join, user.id).catch(() => {});
  const [addr] = await db.select().from(addresses).where(eq(addresses.userId, user.id)).limit(1);
  const cs = await db.select().from(circles).where(and(eq(circles.towerId, addr.towerId), ne(circles.status, "cancelled"))).orderBy(desc(circles.createdAt));
  const mine = await db.select().from(circleMembers).where(eq(circleMembers.userId, user.id));
  // neighbour karma: jobs approved per customer in this society (anonymised handles)
  const board = await db.select({ u: users.id, n: count() }).from(tasks).innerJoin(users, eq(users.id, tasks.customerId)).where(and(eq(tasks.status, "approved"), eq(users.societyId, user.societyId ?? addr.societyId))).groupBy(users.id).orderBy(desc(count())).limit(5);
  const ids = board.map((b) => b.u);
  const names = ids.length ? await db.select().from(users).where(inArray(users.id, ids)) : [];
  return (
    <div className="space-y-6"><div><h1 className="text-3xl font-semibold text-tide">Shell Circles</h1><p className="text-ink/60">Book with neighbours in your tower. The more flats join, the less everyone pays.</p></div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="space-y-3">{cs.length === 0 && <EmptyState icon="circle" title="No Circles yet." note="Start one and invite a neighbour." />}
        {cs.map((c) => <CircleCard key={c.id} c={{ id: c.id, title: c.title, current: c.currentFlats, min: c.minFlats, max: c.maxFlats, status: c.status, when: fmtDateTime(c.windowStart), discount: circleDiscount(c.currentFlats) }} joined={mine.some((m) => m.circleId === c.id)} mine={c.createdBy === user.id} />)}
        <section className="card p-4"><h2 className="font-semibold">Society leaderboard</h2><p className="text-xs text-ink/50">Completed jobs, with names shortened for privacy.</p><ol className="mt-3 space-y-2 text-sm">{board.map((b, i) => { const n = names.find((x) => x.id === b.u)?.name ?? ""; return <li key={b.u} className="flex items-center justify-between"><span>{i + 1}. {n.split(" ")[0]} {n.split(" ")[1]?.[0]}.</span><span className="pill">{b.n} jobs</span></li>; })}{board.length === 0 && <li className="text-ink/50">Complete a job to join the board.</li>}</ol></section></div>
        <CircleCreate /></div></div>
  );
}
