import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { disputes, plans, tasks } from "@/db/schema";
import { DisputeForm } from "@/components/app/Misc";
import { Countdown } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Disputes" };

export default async function Page({ searchParams }: { searchParams: Promise<{ task?: string }> }) {
  const user = await requireUser(["CUSTOMER"]);
  const sp = await searchParams;
  const [ds, ts] = await Promise.all([db.select().from(disputes).where(eq(disputes.openedBy, user.id)).orderBy(desc(disputes.createdAt)), db.select({ id: tasks.id, name: tasks.name }).from(tasks).innerJoin(plans, eq(plans.id, tasks.planId)).where(eq(plans.customerId, user.id))]);
  return (
    <div className="space-y-4"><h1 className="display text-3xl">Disputes</h1>
      {ds.map((d) => <div key={d.id} className="rounded-2xl border-2 border-ink bg-paper p-4"><div className="flex justify-between"><b className="capitalize">{d.reason.replace("_", " ")}</b><span className="stamp">{d.status.replace("_", " ")}</span></div><p className="text-sm">{d.description}</p>{d.status !== "resolved" ? <p className="mono mt-1 text-xs">Hum 24 ghante mein reply denge. SLA <Countdown to={d.slaDueAt} /></p> : <p className="mt-1 text-sm font-semibold">Outcome: {d.resolution?.action.replace("_", " ")} {d.resolution?.amount ? `(₹${d.resolution.amount / 100})` : ""}. Appeal ek baar kar sakte ho.</p>}</div>)}
      <DisputeForm tasks={ts} initial={sp.task} /></div>
  );
}
