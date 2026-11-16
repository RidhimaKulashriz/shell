import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, bookings, notifications } from "@/db/schema";
import { verifyRazorpayWebhookSignature } from "@/lib/payments";
import { sendSms } from "@/lib/sms";

// Public webhook — idempotent, verifies signature when RAZORPAY_WEBHOOK_SECRET is set
export async function POST(req: Request) {
  const raw = await req.text();
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signature = req.headers.get("x-razorpay-signature") ?? req.headers.get("X-Razorpay-Signature");
  if (!verifyRazorpayWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Razorpay standard: { event, payload: { payment: { entity: { id, order_id, status, notes } } } }
  // Test shorthand we also accept: { event: "payment.captured", payload: { payment: { entity: { order_id, id, status, notes: { bookingId } } } }, eventId }
  const event: string = payload.event ?? payload.type ?? "payment.captured";
  const entity = payload.payload?.payment?.entity ?? payload.payment ?? payload.entity ?? {};
  const orderId: string | undefined = entity.order_id ?? entity.orderId ?? payload.orderId;
  const paymentId: string | undefined = entity.id ?? entity.payment_id ?? payload.paymentId;
  const bookingIdFromNotes: string | undefined = entity.notes?.bookingId ?? payload.notes?.bookingId ?? payload.bookingId;
  const eventId: string = payload.id ?? payload.eventId ?? `${event}_${paymentId ?? orderId ?? Date.now()}`;

  if (!orderId && !bookingIdFromNotes) {
    return NextResponse.json({ error: "Missing order_id or bookingId" }, { status: 400 });
  }

  // Locate booking by orderId or notes.bookingId
  let booking: typeof bookings.$inferSelect | undefined;
  if (bookingIdFromNotes) {
    const [r] = await db.select().from(bookings).where(eq(bookings.id, bookingIdFromNotes)).limit(1);
    booking = r;
  }
  if (!booking && orderId) {
    const [r] = await db.select().from(bookings).where(eq(bookings.razorpayOrderId, orderId)).limit(1);
    booking = r;
  }
  if (!booking) {
    // Also try lookup by orderId stored without prefix? fallback: search all pending with same orderId text
    return NextResponse.json({ error: "Booking not found for webhook" }, { status: 404 });
  }

  // Idempotency: if payment already marked PAID with same paymentId, return ok
  const webhookEvents = (booking.webhookEvents as { id: string; type: string; ts: string }[]) ?? [];
  if (webhookEvents.some((e) => e.id === eventId)) {
    return NextResponse.json({ ok: true, duplicate: true, message: "Event already processed" });
  }
  if (booking.paymentStatus === "PAID" && booking.razorpayPaymentId && paymentId && booking.razorpayPaymentId === paymentId) {
    return NextResponse.json({ ok: true, duplicate: true, message: "Payment already marked PAID" });
  }
  // Also idempotent if already PAID regardless of eventId (prevents double credit)
  if (booking.paymentStatus === "PAID") {
    // still record event for audit but don't change state
    const updatedEvents = [...webhookEvents, { id: eventId, type: event, ts: new Date().toISOString() }].slice(-20);
    await db.update(bookings).set({ webhookEvents: updatedEvents }).where(eq(bookings.id, booking.id));
    return NextResponse.json({ ok: true, duplicate: true, paymentStatus: "PAID" });
  }

  // Mark PAID
  const now = new Date();
  const updatedEvents = [...webhookEvents, { id: eventId, type: event, ts: now.toISOString() }].slice(-20);
  await db.update(bookings).set({
    paymentStatus: "PAID",
    paymentMethod: booking.paymentMethod ?? "RAZORPAY",
    razorpayPaymentId: paymentId ?? booking.razorpayPaymentId,
    paidAt: now,
    webhookEvents: updatedEvents,
  }).where(eq(bookings.id, booking.id));

  await db.insert(auditLogs).values({
    actorId: null,
    action: "payment_webhook_paid",
    entity: "booking",
    entityId: booking.id,
    before: { paymentStatus: booking.paymentStatus, orderId },
    after: { paymentStatus: "PAID", paymentId, eventId },
  });

  // In-app notification + SMS (best-effort, no throw)
  await db.insert(notifications).values({
    userId: booking.customerId,
    type: "payment_paid",
    channel: "inapp",
    title: "Payment confirmed",
    body: `Rs ${booking.total} for ${booking.serviceName} — PAID. Slot ${new Date(booking.slotStart).toLocaleString("en-IN")}`,
    payload: { bookingId: booking.id, paymentId, orderId },
  }).catch(() => {});
  // SMS via provider interface
  // we don't have phone here, so skip if unavailable — ops can still see notification
  // Fetch user phone via users table if needed (optional)
  try {
    const { users } = await import("@/db/schema");
    const [u] = await db.select().from(users).where(eq(users.id, booking.customerId)).limit(1);
    if (u?.phone) await sendSms(u.phone, `Shell: Payment Rs ${booking.total} for ${booking.serviceName} confirmed. Booking ${booking.id.slice(0, 8)} PAID.`);
  } catch {}

  return NextResponse.json({ ok: true, paymentStatus: "PAID", bookingId: booking.id });
}
