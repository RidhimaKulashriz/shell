import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { offers, payments, plans, tasks, requests, customerProfiles } from "@/db/schema";
import { recordCapture } from "@/lib/money";
import { suggestHelpers } from "@/lib/dispatch";
import { logEvent } from "@/lib/plans";
import { notify } from "@/lib/notify";
import { sql } from "drizzle-orm";

/** Offer each unassigned task to the two best eligible helpers (one active offer per helper per overlapping window is enforced here). */
export async function createOffers(planId: string) {
  const ts = await db.select().from(tasks).where(and(eq(tasks.planId, planId), eq(tasks.status, "planned")));
  for (const t of ts) {
    if (t.assignedHelperId) continue;
    const cands = (await suggestHelpers(t.id, 5)).filter((c) => c.eligible).slice(0, 2);
    for (const c of cands) {
      const busy = await db.select({ id: offers.id }).from(offers).innerJoin(tasks, eq(tasks.id, offers.taskId)).where(and(eq(offers.helperId, c.helperId), eq(offers.status, "sent"), t.scheduledStart ? sql`${tasks.scheduledStart} < ${t.scheduledEnd ?? t.scheduledStart} and ${tasks.scheduledEnd} > ${t.scheduledStart}` : sql`false`));
      if (busy.length) continue;
      const soon = !t.scheduledStart || t.scheduledStart.getTime() - Date.now() < 3 * 3600000;
      await db.insert(offers).values({ taskId: t.id, helperId: c.helperId, payout: t.helperPayout, expiresAt: new Date(Date.now() + (soon ? 90 * 1000 : 30 * 60000)), score: c.score, breakdown: c.breakdown });
    }
    if (cands.length) await db.update(tasks).set({ status: "offered", updatedAt: new Date() }).where(eq(tasks.id, t.id));
  }
}

/** Idempotent: marks the payment captured, books the escrow journal, approves the plan and starts dispatch. */
export async function capturePlanPayment(orderId: string, paymentId: string, method = "upi") {
  const [p] = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);
  if (!p) throw new Error("Unknown order");
  if (p.status === "captured") return { already: true, planId: p.planId };
  await db.update(payments).set({ status: "captured", paymentId, method, updatedAt: new Date() }).where(eq(payments.id, p.id));
  await recordCapture(p.planId, p.amount, p.creditsUsed);
  await db.update(plans).set({ status: "approved", paidAt: new Date(), approvedAt: new Date(), updatedAt: new Date() }).where(eq(plans.id, p.planId));
  const [plan] = await db.select().from(plans).where(eq(plans.id, p.planId)).limit(1);
  if (plan?.requestId) await db.update(requests).set({ status: "approved", updatedAt: new Date() }).where(eq(requests.id, plan.requestId));
  if (p.creditsUsed) await db.update(customerProfiles).set({ creditsBalance: sql`${customerProfiles.creditsBalance} - ${p.creditsUsed}` }).where(eq(customerProfiles.userId, p.customerId));
  await logEvent(null, p.planId, "plan_paid", { amount: p.amount, method });
  await createOffers(p.planId);
  await notify(p.customerId, "payment_success", { amount: Math.round(p.amount / 100) });
  return { already: false, planId: p.planId };
}
