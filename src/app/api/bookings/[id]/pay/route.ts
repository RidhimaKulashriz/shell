import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, bookings, notifications } from "@/db/schema";
import { api, body } from "@/lib/api";
import { buildUpiString, createMockRazorpayOrder } from "@/lib/payments";
import { sendSms } from "@/lib/sms";

const Schema = z.object({ method: z.enum(["UPI", "RAZORPAY"]) });

export const POST = api<{ id: string }>(async ({ req, params, user }) => {
  const { method } = await body(req, Schema);
  const [row] = await db.select().from(bookings).where(eq(bookings.id, params.id)).limit(1);
  if (!row) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (row.customerId !== user!.id && user!.role !== "OPS" && user!.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (row.paymentStatus === "PAID") {
    return { ok: true, paymentStatus: "PAID", message: "Already paid." };
  }

  if (method === "UPI") {
    const upiString = buildUpiString({ amount: row.total, note: `Shell ${row.serviceName} ${row.id.slice(0, 8)}` });
    await db.update(bookings).set({ paymentMethod: "UPI", paymentStatus: "PENDING" }).where(eq(bookings.id, row.id));
    await db.insert(auditLogs).values({ actorId: user!.id, action: "payment_upi_pending", entity: "booking", entityId: row.id, before: { paymentStatus: row.paymentStatus }, after: { paymentMethod: "UPI", paymentStatus: "PENDING" } });
    sendSms(user!.phone ?? "", `Shell: Pay Rs ${row.total} for ${row.serviceName}. UPI: ${upiString.slice(0, 60)}…`).catch(() => {});
    return { ok: true, paymentStatus: "PENDING", paymentMethod: "UPI", upiString, message: "UPI pending — scan QR in your UPI app. Test webhook will mark PAID." };
  }

  const order = createMockRazorpayOrder({ bookingId: row.id, amount: row.total });
  await db.update(bookings).set({ paymentMethod: "RAZORPAY", paymentStatus: "PENDING", razorpayOrderId: order.id }).where(eq(bookings.id, row.id));
  await db.insert(auditLogs).values({ actorId: user!.id, action: "payment_razorpay_order", entity: "booking", entityId: row.id, before: { paymentStatus: row.paymentStatus }, after: { paymentMethod: "RAZORPAY", paymentStatus: "PENDING", orderId: order.id } });
  await db.insert(notifications).values({ userId: row.customerId, type: "payment_order", channel: "inapp", title: "Payment order created", body: `Razorpay order ${order.id} for Rs ${row.total} — ${row.serviceName}`, payload: { bookingId: row.id, orderId: order.id } }).catch(() => {});
  return { ok: true, paymentStatus: "PENDING", paymentMethod: "RAZORPAY", orderId: order.id, amount: order.amount, currency: order.currency, message: "Razorpay test order created. Call webhook to mark PAID." };
}, { roles: ["CUSTOMER"], limit: { key: "pay", max: 10, windowMs: 60000 } });
