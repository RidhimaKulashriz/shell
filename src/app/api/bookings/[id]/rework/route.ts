import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, bookings } from "@/db/schema";
import { api, body } from "@/lib/api";

const Schema = z.object({ note: z.string().max(500).optional() });

export const POST = api<{ id: string }>(async ({ req, params, user }) => {
  const { note } = await body(req, Schema);
  const [row] = await db.select().from(bookings).where(eq(bookings.id, params.id)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.customerId !== user!.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  if (row.status !== "COMPLETED") return NextResponse.json({ error: "Rework only after COMPLETED" }, { status: 400 });
  // 24h window from updatedAt (completion time)
  const completedAt = row.updatedAt ?? row.createdAt;
  if (Date.now() - new Date(completedAt).getTime() > 24 * 3600 * 1000) {
    return NextResponse.json({ error: "24h rework window has passed" }, { status: 400 });
  }
  // Move back to IN_PROGRESS for rework — honest, audited
  await db.update(bookings).set({ status: "IN_PROGRESS" }).where(eq(bookings.id, row.id));
  await db.insert(auditLogs).values({ actorId: user!.id, action: "booking_rework_24h", entity: "booking", entityId: row.id, before: { status: row.status }, after: { status: "IN_PROGRESS", note: note ?? "" } });
  return { ok: true, status: "IN_PROGRESS", message: "Rework requested — we will send someone back at no cost within 24h." };
}, { roles: ["CUSTOMER"] });
