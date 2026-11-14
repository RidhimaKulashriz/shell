import { desc, eq, ne, and } from "drizzle-orm";
import { db } from "@/db";
import { circleMembers, circles, customerProfiles, helpers, taskTemplates, users } from "@/db/schema";
import { CircleActions, CircleCreate } from "@/components/app/Misc";
import { requireUser } from "@/lib/auth";
import { activePricing } from "@/lib/data";
import { circleDiscount, circleSavings } from "@/lib/pricing";
import { inr, fmtDateTime } from "@/lib/format";
import { SITE_URL } from "@/lib/seo";

export const metadata = { title: "Circle" };

export default async function Page() {
  const user = await requireUser(["CUSTOMER"]);
  const [list, mine, tpls, cfg, board, hall] = await Promise.all([
    db.select().from(circles).where(ne(circles.status, "cancelled")).orderBy(desc(circles.createdAt)),
    db.select().from(circleMembers).where(eq(circleMembers.userId, user.id)),
    db.select().from(taskTemplates).where(eq(taskTemplates.active, true)),
    activePricing(),
    db.select({ name: users.name, kudos: customerProfiles.kudos, streak: customerProfiles.streak }).from(customerProfiles).innerJoin(users, eq(users.id, customerProfiles.userId)).orderBy(desc(customerProfiles.kudos)).limit(5),
    db.select().from(helpers).where(and(eq(helpers.status, "active"))).orderBy(desc(helpers.ratingAvg), desc(helpers.jobsDone)).limit(3),
  ]);
  return (
    <div className="space-y-5">
      <h1 className="display text-3xl">Shell Circle</h1>
      <p>Join your neighbours: the more flats, the lower the price, and everyone's work is done in one visit. The Circle confirms as soon as the minimum is met.</p>
      {list.map((c) => { const price = Math.round(c.basePrice * (1 - circleDiscount(c.currentFlats, cfg))); return (
        <div key={c.id} className="rounded-2xl border border-ink/20 bg-sage p-4"><div className="flex items-center justify-between"><b className="display text-xl">{c.title}</b><span className="stamp">{c.status}</span></div><p className="mono text-xs">{fmtDateTime(c.windowStart)} · min {c.minFlats}, max {c.maxFlats}</p>
          <div className="mt-2 h-3 overflow-hidden rounded-full border border-ink/20 bg-paper" role="progressbar" aria-valuenow={c.currentFlats} aria-valuemax={c.maxFlats}><div className="h-full bg-forest" style={{ width: `${(c.currentFlats / c.maxFlats) * 100}%` }} /></div>
          <p className="mt-1 text-sm">{c.currentFlats} of {c.maxFlats} flats joined. Price per flat now <b>{inr(price)}</b>.</p>
          <div className="mt-2 flex items-end gap-1" aria-label="Price curve">{circleSavings(c.basePrice, cfg).map((s) => <div key={s.flats} className="flex-1 text-center"><div className={`rounded-t ${s.flats === c.currentFlats ? "bg-sun" : "bg-paper"} border border-ink/20`} style={{ height: `${Math.round((s.perFlat / c.basePrice) * 40)}px` }} /><span className="mono text-[10px]">{s.flats}</span></div>)}</div>
          <CircleActions circleId={c.id} joined={mine.some((m) => m.circleId === c.id)} link={`${SITE_URL}/circle/${c.inviteCode}`} /></div>); })}
      <CircleCreate templates={tpls.filter((t) => ["clean-room", "clean-bathroom", "utensils", "clean-full-home", "pet-walk"].includes(t.slug)).map((t) => ({ slug: t.slug, name: t.nameEn }))} />
      <section><h2 className="display text-2xl">Society leaderboard</h2><ol className="mt-2 space-y-2">{board.map((b, i) => <li key={i} className="flex items-center justify-between rounded-xl bg-paper p-3"><span><span className="mono mr-2">{i + 1}</span>{b.name.split(" ")[0]}</span><span className="mono text-sm">{b.kudos} kudos · {b.streak} streak</span></li>)}</ol></section>
      <section><h2 className="display text-2xl">Helper Hall of Fame</h2><div className="mt-2 grid grid-cols-3 gap-2">{hall.map((h) => <div key={h.id} className="rounded-xl border border-ink/20 bg-paper p-2 text-center"><span className="display grid h-10 w-10 mx-auto place-items-center rounded-full bg-sand">{h.displayName[0]}</span><b className="text-sm">{h.displayName.split(" ")[0]}</b><div className="mono text-xs">{h.ratingAvg.toFixed(1)}</div></div>)}</div></section>
    </div>
  );
}
