import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, bookings, notifications } from "@/db/schema";
import { api } from "@/lib/api";
import { sendSms } from "@/lib/sms";

export const POST = api<{ id: string }>(async ({ params, user }) => {
  const [row] = await db.select().from(bookings).where(eq(bookings.id, params.id)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.paymentStatus === "PAID") return { ok: true, paymentStatus: "PAID", message: "Already PAID" };
  const now = new Date();
  await db.update(bookings).set({ paymentStatus: "PAID", paidAt: now }).where(eq(bookings.id, row.id));
  await db.insert(auditLogs).values({ actorId: user!.id, action: "payment_mark_paid_ops", entity: "booking", entityId: row.id, before: { paymentStatus: row.paymentStatus }, after: { paymentStatus: "PAID", by: "ops" } });
  await db.insert(notifications).values({ userId: row.customerId, type: "payment_paid", channel: "inapp", title: "Payment confirmed", body: `Rs ${row.total} for ${row.serviceName} — PAID (confirmed by ops).`, payload: { bookingId: row.id } }).catch(() => {});
  try {
    const { users } = await import("@/db/schema");
    const [u] = await db.select().from(users).where(eq(users.id, row.customerId)).limit(1);
    if (u?.phone) await sendSms(u.phone, `Shell: Payment Rs ${row.total} for ${row.serviceName} confirmed (PAID).`);
  } catch {}
  return { ok: true, paymentStatus: "PAID" };
}, { roles: ["OPS", "SUPER_ADMIN"] });
