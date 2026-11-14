import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { customerProfiles, payments, plans, promoCodes } from "@/db/schema";
import { AppError, api, body, need } from "@/lib/api";
import { capturePlanPayment } from "@/lib/checkout";
import { paymentProvider, signMock } from "@/lib/money";

export const POST = api<{ action: string }>(async ({ req, params, user }) => {
  if (params.action === "orders") {
    const b = await body(req, z.object({ planId: z.string().uuid(), useCredits: z.boolean().default(true), promo: z.string().max(20).optional(), idempotencyKey: z.string().min(8).max(80) }));
    // idempotency: the same key always returns the same order and never creates a second charge
    const [dup] = await db.select().from(payments).where(eq(payments.idempotencyKey, b.idempotencyKey)).limit(1);
    if (dup) return { orderId: dup.orderId, amount: dup.amount, keyId: paymentProvider.keyId, provider: paymentProvider.name };
    const [plan] = await db.select().from(plans).where(and(eq(plans.id, b.planId), eq(plans.customerId, user!.id))).limit(1);
    need(plan, "Plan");
    if (plan.status !== "sent") throw new AppError(409, "not_payable", "This plan is not waiting for payment.", "यह प्लान अभी पेमेंट के लिए तैयार नहीं है।");
    const [paid] = await db.select().from(payments).where(and(eq(payments.planId, plan.id), eq(payments.status, "captured"))).limit(1);
    if (paid) throw new AppError(409, "already_paid", "Already paid.");
    let total = plan.total;
    let promoUsed: string | null = null;
    if (b.promo) {
      const [pc] = await db.select().from(promoCodes).where(eq(promoCodes.code, b.promo.toUpperCase())).limit(1);
      if (!pc || pc.used >= pc.maxUses || (pc.expiresAt && pc.expiresAt < new Date())) throw new AppError(400, "bad_promo", "That promo code is not valid.", "यह प्रोमो कोड सही नहीं है।");
      total -= Math.min(total, pc.percent ? Math.round((total * pc.percent) / 100) : pc.flat);
      promoUsed = pc.code;
    }
    const [prof] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user!.id)).limit(1);
    const credits = b.useCredits ? Math.min(prof?.creditsBalance ?? 0, total) : 0;
    const payable = total - credits;
    const order = await paymentProvider.createOrder(payable, plan.id.slice(0, 20));
    await db.insert(payments).values({ planId: plan.id, customerId: user!.id, orderId: order.id, amount: payable, creditsUsed: credits, promoCode: promoUsed, idempotencyKey: b.idempotencyKey, provider: paymentProvider.name });
    return { orderId: order.id, amount: payable, credits, keyId: paymentProvider.keyId, provider: paymentProvider.name };
  }
  if (params.action === "verify") {
    const b = await body(req, z.object({ orderId: z.string(), paymentId: z.string().optional(), signature: z.string().optional(), mock: z.boolean().optional(), method: z.string().optional() }));
    const [p] = await db.select().from(payments).where(and(eq(payments.orderId, b.orderId), eq(payments.customerId, user!.id))).limit(1);
    need(p, "Order");
    let paymentId = b.paymentId ?? "";
    let signature = b.signature ?? "";
    if (b.mock && paymentProvider.name === "mock") {
      paymentId = "pay_mock_" + Math.random().toString(36).slice(2, 10);
      signature = signMock(b.orderId, paymentId);
    }
    if (!paymentProvider.verifySignature(b.orderId, paymentId, signature)) throw new AppError(400, "bad_signature", "Payment signature could not be verified.", "पेमेंट सत्यापित नहीं हो सका।");
    const r = await capturePlanPayment(b.orderId, paymentId, b.method ?? "upi");
    return { ok: true, planId: r.planId };
  }
  throw new AppError(404, "not_found", "Unknown action");
}, { roles: ["CUSTOMER"], limit: { key: "checkout", max: 30, windowMs: 600000 } });
