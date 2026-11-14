import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customerProfiles, helpers, plans, shellNotes, taskTemplates, tasks, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Shell Wrapped" };

export default async function Page() {
  const user = await requireUser(["CUSTOMER"]);
  const mine = await db.select({ t: tasks, c: taskTemplates.categorySlug }).from(tasks).innerJoin(plans, eq(plans.id, tasks.planId)).innerJoin(taskTemplates, eq(taskTemplates.slug, tasks.templateSlug)).where(and(eq(plans.customerId, user.id), eq(tasks.status, "approved")));
  const minutes = mine.reduce((s, x) => s + x.t.durationEstMin, 0);
  const catCount = new Map<string, number>(); const hc = new Map<string, number>();
  for (const x of mine) { catCount.set(x.c, (catCount.get(x.c) ?? 0) + 1); if (x.t.assignedHelperId) hc.set(x.t.assignedHelperId, (hc.get(x.t.assignedHelperId) ?? 0) + 1); }
  const top = [...catCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const favId = [...hc.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const [fav] = favId ? await db.select().from(helpers).where(eq(helpers.id, favId)).limit(1) : [];
  const [rank] = await db.select({ n: count() }).from(customerProfiles).where(sql`${customerProfiles.kudos} > (select kudos from customer_profiles where user_id = ${user.id})`);
  const [note] = await db.select().from(shellNotes).where(eq(shellNotes.fromUserId, user.id)).orderBy(desc(shellNotes.createdAt)).limit(1);
  void users;
  const cards: [string, string, string][] = [["Hours saved", `${(minutes / 60).toFixed(1)}h`, "Your time back"], ["Jobs done", String(mine.length), "Home ready, every time"], ["Favourite helper", fav?.displayName.split(" ")[0] ?? "-", fav ? `${hc.get(fav.id)} jobs together` : "None yet"], ["Top category", top.replace(/-/g, " "), "Most requested"], ["Society rank", `#${Number(rank.n) + 1}`, "In neighbour karma"], ["Shell Note", note ? `"${note.body}"` : "Send a note", "You wrote"]];
  return (
    <div className="space-y-4"><h1 className="display text-3xl">Shell Wrapped</h1><p className="hand text-xl">Is mahine ki kahani</p>
      <div className="hide-scroll -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3">{cards.map(([t, v, s], i) => <div key={t} className="receipt scallop-b w-72 shrink-0 snap-center" style={{ transform: `rotate(${[-1.5, 1, -0.8, 1.4, -1, 0.7][i]}deg)` }}><div className="mono text-xs uppercase opacity-60">{t}</div><div className="display my-6 text-4xl" style={{ fontFamily: "var(--font-display)" }}>{v}</div><p>{s}</p></div>)}</div>
      <a className="btn btn-sun" href={`/api/og?kind=wrapped&title=${encodeURIComponent(mine.length + " jobs, " + (minutes / 60).toFixed(0) + " hours saved")}&sub=${encodeURIComponent("My Shell Wrapped")}`} target="_blank" rel="noopener noreferrer">Share story image</a></div>
  );
}
