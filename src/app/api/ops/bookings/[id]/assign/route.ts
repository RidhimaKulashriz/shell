import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, bookings, helpers } from "@/db/schema";
import { api, body } from "@/lib/api";

export const POST = api<{ id: string }>(async ({ req, params, user }) => {
  const { helperId } = await body(req, z.object({ helperId: z.string().uuid() }));
  const [row] = await db.select().from(bookings).where(eq(bookings.id, params.id)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.status !== "RECEIVED") return NextResponse.json({ error: "Can assign only when RECEIVED" }, { status: 400 });
  const [h] = await db.select().from(helpers).where(eq(helpers.id, helperId)).limit(1);
  if (!h) return NextResponse.json({ error: "Helper not found" }, { status: 404 });
  const before = { status: row.status, helperId: row.helperId };
  await db.update(bookings).set({ helperId, status: "ASSIGNED" }).where(eq(bookings.id, row.id));
  await db.insert(auditLogs).values({ actorId: user!.id, action: "booking_assign", entity: "booking", entityId: row.id, before, after: { status: "ASSIGNED", helperId } });
  return { ok: true, status: "ASSIGNED" };
}, { roles: ["OPS", "SUPER_ADMIN"] });
