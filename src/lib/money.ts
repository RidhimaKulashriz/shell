import crypto from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ledgerEntries, payouts, tasks, plans, helpers, payments } from "@/db/schema";
import { assertBalanced, capture, expenseHold, payout as payoutJournal, refund as refundJournal, release, type Entry } from "@/lib/ledger";
import { payoutGuard } from "@/lib/statemachine";
import { activePricing } from "@/lib/data";

export async function postJournal(entries: Entry[], refType: string, refId: string) {
  assertBalanced(entries);
  const journalId = crypto.randomUUID();
  await db.insert(ledgerEntries).values(entries.map((e) => ({ journalId, account: e.account, debit: e.debit, credit: e.credit, refType, refId, memo: e.memo })));
  return journalId;
}

export async function recordCapture(planId: string, amount: number, credits = 0) {
  return postJournal(capture(amount, credits), "plan", planId);
}
export async function recordExpenseHold(taskId: string, cap: number) {
  return postJournal(expenseHold(cap), "task", taskId);
}
export async function recordRefund(refType: string, refId: string, amount: number, fromEscrow = true) {
  return postJournal(refundJournal(amount, fromEscrow), refType, refId);
}

/** Releases escrow to the helper once a task is approved or auto-approved. Idempotent per task. */
export async function releaseTaskPayment(taskId: string) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!t) throw new Error("Task not found");
  const guard = payoutGuard({ status: t.status, approvedAt: t.approvedAt });
  if (guard) throw new Error(guard);
  const existing = await db.select({ id: ledgerEntries.id }).from(ledgerEntries).where(and(eq(ledgerEntries.refType, "task_release"), eq(ledgerEntries.refId, taskId))).limit(1);
  if (existing.length) return { already: true };
  const cfg = await activePricing();
  await postJournal(release(t.price, t.helperPayout, cfg.gstPct), "task_release", taskId);
  if (t.assignedHelperId) {
    await db.insert(payouts).values({ helperId: t.assignedHelperId, amount: t.helperPayout, method: "weekly", status: "scheduled", scheduledFor: nextFriday(), taskIds: [taskId] });
    await db.update(helpers).set({ jobsDone: sql`${helpers.jobsDone} + 1` }).where(eq(helpers.id, t.assignedHelperId));
  }
  return { released: t.helperPayout };
}

export function nextFriday() {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
  d.setHours(12, 0, 0, 0);
  return d;
}

export async function instantPayout(helperId: string) {
  const cfg = await activePricing();
  const pending = await db.select().from(payouts).where(and(eq(payouts.helperId, helperId), eq(payouts.status, "scheduled")));
  const amount = pending.reduce((s, p) => s + p.amount, 0);
  if (amount <= 0) return { amount: 0, fee: 0 };
  const fee = Math.round(amount * cfg.instantPayoutFeePct);
  const utr = "MOCKUTR" + crypto.randomBytes(5).toString("hex").toUpperCase();
  for (const p of pending) await db.update(payouts).set({ status: "paid", method: "instant", utr }).where(eq(payouts.id, p.id));
  await postJournal(payoutJournal(amount, fee), "payout", helperId);
  return { amount: amount - fee, fee, utr };
}

/* ---- Razorpay behind an interface. RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET switch from mock to live. ---- */
export interface PaymentProvider {
  name: string;
  createOrder(amount: number, receipt: string): Promise<{ id: string; amount: number }>;
  verifySignature(orderId: string, paymentId: string, signature: string): boolean;
  keyId: string;
}
const SECRET = () => process.env.RAZORPAY_KEY_SECRET ?? "mock_razorpay_secret";
export const paymentProvider: PaymentProvider = {
  name: process.env.RAZORPAY_KEY_ID ? "razorpay" : "mock",
  keyId: process.env.RAZORPAY_KEY_ID ?? "rzp_test_mock",
  async createOrder(amount, receipt) {
    if (process.env.RAZORPAY_KEY_ID) {
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${SECRET()}`).toString("base64") },
        body: JSON.stringify({ amount, currency: "INR", receipt }),
      });
      const j = (await res.json()) as { id: string };
      return { id: j.id, amount };
    }
    return { id: "order_mock_" + crypto.randomBytes(7).toString("hex"), amount };
  },
  verifySignature(orderId, paymentId, signature) {
    const expected = crypto.createHmac("sha256", SECRET()).update(`${orderId}|${paymentId}`).digest("hex");
    return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  },
};
export const signMock = (orderId: string, paymentId: string) => crypto.createHmac("sha256", SECRET()).update(`${orderId}|${paymentId}`).digest("hex");

export async function ledgerBalanceCheck() {
  const [r] = await db.select({ d: sql<number>`coalesce(sum(${ledgerEntries.debit}),0)`, c: sql<number>`coalesce(sum(${ledgerEntries.credit}),0)` }).from(ledgerEntries);
  return { debit: Number(r.d), credit: Number(r.c), balanced: Number(r.d) === Number(r.c) };
}

export async function paymentsForPlan(planId: string) {
  return db.select().from(payments).where(eq(payments.planId, planId));
}
export async function markPlanPaid(planId: string) {
  await db.update(plans).set({ paidAt: new Date(), status: "approved", approvedAt: new Date(), updatedAt: new Date() }).where(eq(plans.id, planId));
}
