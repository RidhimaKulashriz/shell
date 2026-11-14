import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { plans, tasks, users } from "@/db/schema";
import { Countdown, Ring } from "@/components/ui";
import { readinessPct } from "@/lib/statemachine";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ghar status", robots: { index: false } };

/** Shareable family link: Readiness Ring + countdown only. No addresses, no helper details. */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const [plan] = await db.select().from(plans).where(eq(plans.shareToken, (await params).token)).limit(1);
  if (!plan) notFound();
  const ts = await db.select().from(tasks).where(eq(tasks.planId, plan.id));
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, plan.customerId)).limit(1);
  const pct = readinessPct(ts.map((t) => t.status));
  return (
    <main id="main" className="grid min-h-screen place-items-center bg-cream p-6 text-center">
      <div className="max-w-sm"><p className="hand text-3xl">{u?.name.split(" ")[0] ?? "Aapke"} ka ghar</p><h1 className="display mt-1 text-3xl">{plan.title}</h1><div className="my-6"><Ring pct={pct} size={220} label="Ghar Ready" /></div>{plan.deadlineAt && <p className="mono">Deadline <Countdown to={plan.deadlineAt} prefix="in " /></p>}<p className="mt-4 text-sm opacity-70">{ts.filter((t) => t.status === "approved").length} of {ts.length} kaam ho chuke hain.</p></div>
    </main>
  );
}
