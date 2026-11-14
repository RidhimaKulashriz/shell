import { route, ApiError } from "@/lib/api";
import { createOrder, capturePayment } from "@/lib/tasks";
import { z } from "zod";
const schema = z.object({ method: z.enum(["upi", "card", "netbanking", "wallet"]).default("upi"), useCredits: z.boolean().default(true), useWallet: z.boolean().default(false), promo: z.string().max(20).nullable().optional(), idempotencyKey: z.string().min(8).max(80) });
// Mock Razorpay: order is created, then captured immediately. In production the client opens Razorpay Checkout
// and /api/webhooks/razorpay (signed, idempotent) captures the payment.
export const POST = route<{ id: string }>({ roles: ["CUSTOMER"], limit: [10, 60000] }, async ({ params, body, user }) => {
  const p = schema.safeParse(body);
  if (!p.success) throw new ApiError("invalid", "Please check your payment details.");
  const pay = await createOrder({ planId: params.id, userId: user.id, method: p.data.method, useCredits: p.data.useCredits, useWallet: p.data.useWallet, promo: p.data.promo === undefined ? undefined : p.data.promo || null, idempotencyKey: `${user.id}:${p.data.idempotencyKey}` });
  const done = await capturePayment(pay.id);
  return { ok: true, paymentId: done.paymentId, amount: pay.amount };
});
