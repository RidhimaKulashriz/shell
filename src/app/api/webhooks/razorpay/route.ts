import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { capturePayment } from "@/lib/tasks";

// Signed + idempotent. Set RAZORPAY_WEBHOOK_SECRET in production.
export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "dev_webhook_secret";
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return Response.json({ error: "bad signature" }, { status: 400 });
  const event = JSON.parse(raw);
  const eventId = req.headers.get("x-razorpay-event-id") ?? event?.id ?? "";
  const orderId = event?.payload?.payment?.entity?.order_id;
  if (!orderId) return Response.json({ ok: true });
  const [pay] = await db.select().from(payments).where(eq(payments.orderId, orderId));
  if (!pay) return Response.json({ ok: true });
  if (pay.webhookEvents.includes(eventId)) return Response.json({ ok: true, duplicate: true });
  await db.update(payments).set({ webhookEvents: [...pay.webhookEvents, eventId] }).where(eq(payments.id, pay.id));
  if (event.event === "payment.captured") await capturePayment(pay.id, event.payload.payment.entity.id);
  if (event.event === "payment.failed") await db.update(payments).set({ status: "failed" }).where(eq(payments.id, pay.id));
  return Response.json({ ok: true });
}
