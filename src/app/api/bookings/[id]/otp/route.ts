import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { api, body } from "@/lib/api";
import { sha } from "@/lib/auth";

const Schema = z.object({ code: z.string().min(4).max(6) });

export const POST = api<{ id: string }>(async ({ req, params, user }) => {
  const b = await body(req, Schema);
  const [row] = await db.select().from(bookings).where(eq(bookings.id, params.id)).limit(1);
  if (!row) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  // customer or helper or ops can verify? For MVP allow owner or any auth
  if (row.customerId !== user!.id && user!.role !== "HELPER" && user!.role !== "OPS" && user!.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  if (row.status === "CANCELLED" || row.status === "COMPLETED") {
    return NextResponse.json({ error: "Booking already closed." }, { status: 400 });
  }
  if (row.otpFailures >= 5) {
    return NextResponse.json({ error: "Too many wrong tries. Contact support." }, { status: 429 });
  }
  const hash = sha(b.code);
  if (hash !== row.doorOtpHash) {
    await db.update(bookings).set({ otpFailures: row.otpFailures + 1 }).where(eq(bookings.id, row.id));
    const remaining = 5 - (row.otpFailures + 1);
    return NextResponse.json({ error: "Wrong OTP.", remaining }, { status: 400 });
  }
  // success — mark in_progress
  await db.update(bookings).set({ status: "IN_PROGRESS", otpFailures: 0 }).where(eq(bookings.id, row.id));
  return NextResponse.json({ ok: true, status: "IN_PROGRESS" });
});
