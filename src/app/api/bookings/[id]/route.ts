import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { api } from "@/lib/api";

export const GET = api<{ id: string }>(async ({ params, user }) => {
  const [row] = await db.select().from(bookings).where(eq(bookings.id, params.id)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.customerId !== user!.id && user!.role !== "OPS" && user!.role !== "SUPER_ADMIN" && user!.role !== "HELPER") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  return {
    id: row.id,
    serviceName: row.serviceName,
    serviceSlug: row.serviceSlug,
    quantity: row.quantity,
    subtotal: row.subtotal,
    platformFee: row.platformFee,
    discount: row.discount,
    total: row.total,
    slotStart: row.slotStart,
    slotEnd: row.slotEnd,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    status: row.status,
    doorOtp: process.env.ALLOW_DEV_OTP === "true" ? row.doorOtpPlain : undefined,
    helperId: row.helperId,
    createdAt: row.createdAt,
  };
});

export const PATCH = api<{ id: string }>(async ({ params, user }) => {
  // cancel only if RECEIVED
  const [row] = await db.select().from(bookings).where(eq(bookings.id, params.id)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.customerId !== user!.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  if (row.status !== "RECEIVED") return NextResponse.json({ error: "Can cancel only when RECEIVED." }, { status: 400 });
  await db.update(bookings).set({ status: "CANCELLED" }).where(eq(bookings.id, row.id));
  return { ok: true, status: "CANCELLED" };
});
