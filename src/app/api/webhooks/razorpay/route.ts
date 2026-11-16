import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { AppError, api } from "@/lib/api";
import { capturePlanPayment } from "@/lib/checkout";

// Signed, idempotent webhook. Set RAZORPAY_WEBHOOK_SECRET. Duplicate event ids are acknowledged and ignored.
export const POST = api(async ({ req }) => {
  const raw = await req.text();
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "mock_webhook_secret";
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new AppError(401, "bad_signature", "Invalid webhook signature");
  const evt = JSON.parse(raw) as { id?: string; event: string; payload?: { payment?: { entity?: { id: string; order_id: string; method?: string } } } };
  const ent = evt.payload?.payment?.entity;
  if (!ent) return { ok: true };
  const [p] = await db.select().from(payments).where(eq(payments.orderId, ent.order_id)).limit(1);
  if (!p) return { ok: true, ignored: true };
  const id = evt.id ?? `${evt.event}:${ent.id}`;
  if (p.webhookEvents.some((e) => e.id === id)) return { ok: true, duplicate: true };
  await db.update(payments).set({ webhookEvents: [...p.webhookEvents, { id, type: evt.event, ts: new Date().toISOString() }] }).where(eq(payments.id, p.id));
  if (evt.event === "payment.captured") await capturePlanPayment(ent.order_id, ent.id, ent.method);
  if (evt.event === "payment.failed") await db.update(payments).set({ status: "failed", updatedAt: new Date() }).where(eq(payments.id, p.id));
  return { ok: true };
}, { csrf: false });
