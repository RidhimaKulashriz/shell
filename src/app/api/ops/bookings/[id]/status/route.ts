import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, bookings } from "@/db/schema";
import { api, body } from "@/lib/api";

const VALID: Record<string, string[]> = {
  RECEIVED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
};

export const POST = api<{ id: string }>(async ({ req, params, user }) => {
  const { to } = await body(req, z.object({ to: z.enum(["ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]) }));
  const [row] = await db.select().from(bookings).where(eq(bookings.id, params.id)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const allowed = VALID[row.status] ?? [];
  if (!allowed.includes(to)) return NextResponse.json({ error: `Cannot move ${row.status} → ${to}` }, { status: 400 });
  const before = { status: row.status };
  await db.update(bookings).set({ status: to }).where(eq(bookings.id, row.id));
  await db.insert(auditLogs).values({ actorId: user!.id, action: `booking_status_${to.toLowerCase()}`, entity: "booking", entityId: row.id, before, after: { status: to } });
  return { ok: true, status: to };
}, { roles: ["OPS", "SUPER_ADMIN"] });
