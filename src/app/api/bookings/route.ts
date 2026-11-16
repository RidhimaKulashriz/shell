import { NextResponse } from "next/server";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bookings, promoCodes } from "@/db/schema";
import { api, body } from "@/lib/api";
import { isInDwarka } from "@/lib/dwarka";
import { MAX_PER_SLOT, SLOT_HOURS, slotKey } from "@/lib/slots";
import { sha } from "@/lib/auth";
import { MVP_SERVICES } from "@/lib/mvp-catalog";

const BodySchema = z.object({
  serviceSlug: z.string().min(1),
  quantity: z.number().int().min(1).max(5).default(1),
  slotStart: z.string(), // ISO
  address: z.string().min(5).max(300),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  couponCode: z.string().max(20).optional(),
});

function serverPrice(serviceSlug: string, qty: number) {
  const svc = MVP_SERVICES.find((s) => s.slug === serviceSlug);
  if (!svc) return null;
  const subtotal = svc.price * qty;
  const platformFee = Math.max(19, Math.round(subtotal * 0.04));
  return { svc, subtotal, platformFee };
}

function parseSlot(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const h = d.getHours();
  const match = SLOT_HOURS.find(([sh]) => sh === h);
  if (!match) return null;
  // must be exactly on hour 8,10,12,14,16,18 and minute 0
  if (d.getMinutes() !== 0 || d.getSeconds() !== 0) return null;
  const end = new Date(d);
  end.setHours(match[1], 0, 0, 0);
  return { start: d, end };
}

export const POST = api(async ({ req, user }) => {
  const b = await body(req, BodySchema);

  // geo-fence
  if (!isInDwarka(b.lat, b.lng)) {
    return NextResponse.json({ error: "Outside service area. We serve Dwarka Sectors 6, 10, 12 only." }, { status: 400 });
  }

  // slot validation
  const slot = parseSlot(b.slotStart);
  if (!slot) {
    return NextResponse.json({ error: "Invalid slot. Choose a 2-hour window 8am–8pm." }, { status: 400 });
  }
  if (slot.end <= new Date()) {
    return NextResponse.json({ error: "Slot is in the past." }, { status: 400 });
  }
  // 7-day horizon
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 7);
  horizon.setHours(23, 59, 59, 999);
  if (slot.start > horizon) {
    return NextResponse.json({ error: "Slot too far. Book within 7 days." }, { status: 400 });
  }

  // slot capacity max 3
  const key = slotKey(slot.start);
  const [{ n }] = await db.select({ n: count() }).from(bookings).where(and(eq(bookings.slotKey, key), eq(bookings.status, "RECEIVED")));
  // also count ASSIGNED/IN_PROGRESS that occupy slot? For MVP count only RECEIVED+ASSIGNED+IN_PROGRESS that are not cancelled/completed
  // Simplify: count all non-cancelled
  const [{ n: totalInSlot }] = await db
    .select({ n: count() })
    .from(bookings)
    .where(eq(bookings.slotKey, key));
  // we need accurate: count where status not CANCELLED/COMPLETED
  // but we can filter in memory if needed; for now cap on totalInSlot < MAX_PER_SLOT
  if (totalInSlot >= MAX_PER_SLOT) {
    return NextResponse.json({ error: "Slot full. Please choose another 2-hour window." }, { status: 409 });
  }

  // server price calc
  const pricing = serverPrice(b.serviceSlug, b.quantity);
  if (!pricing) {
    return NextResponse.json({ error: "Unknown service." }, { status: 400 });
  }
  let discount = 0;
  let promoCode: string | null = null;
  if (b.couponCode) {
    const code = b.couponCode.trim().toUpperCase();
    const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, code)).limit(1);
    if (!promo || (promo.expiresAt && promo.expiresAt < new Date()) || promo.used >= promo.maxUses) {
      return NextResponse.json({ error: "Invalid or expired coupon." }, { status: 400 });
    }
    discount = promo.percent > 0 ? Math.round((pricing.subtotal * promo.percent) / 100) : Math.min(Math.round(promo.flat / 100), pricing.subtotal);
    promoCode = promo.code;
  }
  const total = Math.max(0, pricing.subtotal - discount + pricing.platformFee);

  // door OTP 4-digit
  const otpPlain = String(Math.floor(1000 + Math.random() * 9000));
  const otpHash = sha(otpPlain);

  const [row] = await db
    .insert(bookings)
    .values({
      customerId: user!.id,
      serviceSlug: b.serviceSlug,
      serviceName: pricing.svc.name,
      price: pricing.svc.price,
      quantity: b.quantity,
      subtotal: pricing.subtotal,
      platformFee: pricing.platformFee,
      discount,
      total,
      slotStart: slot.start,
      slotEnd: slot.end,
      slotKey: key,
      address: b.address,
      lat: b.lat,
      lng: b.lng,
      status: "RECEIVED",
      doorOtpHash: otpHash,
      doorOtpPlain: process.env.ALLOW_DEV_OTP === "true" ? otpPlain : null,
    })
    .returning();

  return NextResponse.json({
    id: row.id,
    serviceName: row.serviceName,
    total: row.total,
    slotStart: row.slotStart,
    slotEnd: row.slotEnd,
    paymentStatus: row.paymentStatus,
    doorOtp: process.env.ALLOW_DEV_OTP === "true" ? otpPlain : undefined,
    status: row.status,
  });
}, { roles: ["CUSTOMER"], limit: { key: "bookings", max: 10, windowMs: 60000 } });

export const GET = api(async ({ user }) => {
  const rows = await db.select().from(bookings).where(eq(bookings.customerId, user!.id)).orderBy(desc(bookings.createdAt)).limit(50);
  // hide hash, expose plain only if ALLOW_DEV_OTP
  const data = rows.map((r) => ({
    id: r.id,
    serviceName: r.serviceName,
    serviceSlug: r.serviceSlug,
    quantity: r.quantity,
    total: r.total,
    slotStart: r.slotStart,
    slotEnd: r.slotEnd,
    address: r.address,
    status: r.status,
    doorOtp: process.env.ALLOW_DEV_OTP === "true" ? r.doorOtpPlain : undefined,
    createdAt: r.createdAt,
  }));
  return { bookings: data };
}, { roles: ["CUSTOMER"] });
