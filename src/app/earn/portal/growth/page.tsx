import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { helpers, strikes } from "@/db/schema";
import { AppealButton } from "@/components/earn/Portal";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Growth" };

export default async function Page() {
  const user = await requireUser(["HELPER"], "/earn/login");
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user.id)).limit(1);
  const [ss, hall] = await Promise.all([db.select().from(strikes).where(eq(strikes.helperId, h.id)).orderBy(desc(strikes.createdAt)), db.select().from(helpers).where(eq(helpers.status, "active")).orderBy(desc(helpers.ratingAvg), desc(helpers.jobsDone)).limit(5)]);
  return (
    <div className="space-y-6"><h1 className="display text-3xl">Growth</h1>
      <section className="grid gap-2">{[["STARTER", "0 to 10 jobs", "Welcome kit, weekly payout"], ["TRUSTED", "11 to 40 jobs, rating 4.6+", "Priority offers, higher payout share"], ["PRO", "41 to 120 jobs", "Managed eligible, instant payout fee waived"], ["ELITE", "121+ jobs, top rating, low cancellations", "Gear kit, paid training, referral bonuses"]].map(([l, r, p]) => <div key={l} className={`rounded-2xl border border-ink/20 p-3 ${l === h.level ? "bg-sun" : "bg-paper"}`}><b className="display text-lg">{l}</b> {l === h.level && <span className="stamp">you</span>}<div className="mono text-xs">{r}</div><p className="text-sm">{p}</p></div>)}</section>
      <section><h2 className="display text-2xl">Strikes and appeals</h2><p className="text-sm">The reason and evidence for every strike are shown here. You can appeal once.</p>{ss.length === 0 && <p className="hand text-xl">No strikes. Well done.</p>}{ss.map((s) => <div key={s.id} className="mt-2 rounded-2xl border border-ink/20 bg-paper p-3"><div className="flex justify-between"><b>{s.reason}</b><span className="stamp stamp-brick">{s.appealStatus === "none" ? "active" : s.appealStatus}</span></div><p className="mono text-xs">{fmtDate(s.createdAt)} · expires {fmtDate(s.expiresAt)}</p><p className="text-sm">Evidence: {s.evidence}</p>{s.appealStatus === "none" ? <AppealButton id={s.id} /> : s.appealNote && <p className="text-sm italic">Your appeal: {s.appealNote}</p>}</div>)}</section>
      <section><h2 className="display text-2xl">Hall of Fame</h2><ol className="mt-2 space-y-2">{hall.map((x, i) => <li key={x.id} className="flex justify-between rounded-xl bg-paper p-3"><span><span className="mono mr-2">{i + 1}</span>{x.displayName.split(" ")[0]}</span><span className="mono text-sm">{x.ratingAvg.toFixed(1)} · {x.jobsDone} jobs</span></li>)}</ol></section>
      <section className="rounded-2xl border border-ink/20 bg-paper p-4"><h2 className="display text-xl">Referrals and college ambassador</h2><p className="text-sm">Refer a friend and you both earn a bonus. Become a college ambassador and run your college's leaderboard. A toolkit with posters and WhatsApp templates is coming soon.</p></section></div>
  );
}
