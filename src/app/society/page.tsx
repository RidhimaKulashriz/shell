import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import * as S from "@/db/schema";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { Logo } from "@/components/icons";
import { LogoutButton } from "@/components/LogoutButton";
import { formatINR } from "@/lib/pricing";
export const metadata = { title: "Society partner" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const u = await requireRole(["SOCIETY_PARTNER"], "/society");
  const [soc] = await db.select().from(S.societies).where(eq(S.societies.id, u.societyId!));
  const res = await db.select().from(S.users).where(eq(S.users.societyId, soc.id));
  const custIds = res.filter((r) => r.role === "CUSTOMER").map((r) => r.id);
  const verified = custIds.length ? await db.select({ n: count() }).from(S.addresses).where(and(eq(S.addresses.societyId, soc.id), sql`${S.addresses.verifiedAt} is not null`)) : [{ n: 0 }];
  const jobs = custIds.length ? await db.select().from(S.tasks).where(inArray(S.tasks.customerId, custIds)) : [];
  const done = jobs.filter((j) => j.status === "approved");
  const roster = done.length ? await db.select({ h: S.helperProfiles, u: S.users }).from(S.helperProfiles).innerJoin(S.users, eq(S.users.id, S.helperProfiles.userId)).where(inArray(S.helperProfiles.userId, [...new Set(done.map((d) => d.helperId!).filter(Boolean))])) : [];
  const revs = custIds.length ? await db.select().from(S.reviews).orderBy(desc(S.reviews.createdAt)).limit(5) : [];
  const circ = await db.select({ t: S.towers.name, n: count() }).from(S.circles).innerJoin(S.towers, eq(S.towers.id, S.circles.towerId)).where(eq(S.circles.societyId, soc.id)).groupBy(S.towers.name);
  const fees = done.reduce((s, j) => s + j.feeShare + (j.price - j.helperPayout), 0);
  const share = Math.round(fees * 0.05);
  return (<div className="min-h-screen bg-bone"><header className="flex items-center justify-between border-b border-line bg-white px-5 py-3"><Logo /><div className="flex items-center gap-3 text-sm"><span className="font-semibold">{soc.name}</span><LogoutButton /></div></header>
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-8"><h1 className="text-3xl font-semibold text-tide">Society dashboard</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[["Verified residents", verified[0].n], ["Jobs completed", done.length], ["Active helpers who served here", roster.length], ["Revenue share (5%)", formatINR(share)]].map(([l, v]) => <div key={String(l)} className="card p-4"><div className="text-xs font-semibold uppercase tracking-wider text-ink/50">{l}</div><div className="serif text-3xl font-bold">{v}</div></div>)}</div>
      <section className="card p-5"><h2 className="font-semibold">Allowed helper roster</h2><p className="text-sm text-ink/60">Verified helpers who have worked in your society. Contact Shell to block anyone.</p><ul className="mt-3 divide-y divide-line text-sm">{roster.map(({ h, u: hu }) => <li key={hu.id} className="flex justify-between py-2"><span>{hu.name}</span><span className="text-ink/60">{h.level.toLowerCase()} · ★ {h.ratingAvg.toFixed(1)} · ID verified</span></li>)}{roster.length === 0 && <li className="py-2 text-ink/50">No jobs completed yet.</li>}</ul></section>
      <div className="grid gap-5 md:grid-cols-2"><section className="card p-5"><h2 className="font-semibold">Circle activity by tower</h2><ul className="mt-2 text-sm">{circ.map((c) => <li key={c.t} className="flex justify-between border-t border-line py-1"><span>{c.t}</span><span className="pill">{c.n} circles</span></li>)}{circ.length === 0 && <li className="text-ink/50">None yet.</li>}</ul></section>
        <section className="card p-5"><h2 className="font-semibold">Recent resident feedback</h2><ul className="mt-2 space-y-2 text-sm">{revs.map((r) => <li key={r.id}>★ {r.rating} {r.note || r.tags.join(", ")}</li>)}</ul></section></div>
      <section className="card p-5"><h2 className="font-semibold">Gates and guard desks</h2><ul className="mt-2 text-sm">{soc.gates.map((g) => <li key={g.name} className="border-t border-line py-1">{g.name}: {g.hours}. {g.rules}</li>)}</ul><p className="mt-2 text-xs text-ink/50">Gate passes are sent to the guard desk automatically for every Shell job.</p></section></main></div>);
}
