import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, bookings, helpers } from "@/db/schema";
import { api } from "@/lib/api";

export const POST = api<{ id: string }>(async ({ params, user }) => {
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user!.id)).limit(1);
  const [row] = await db.select().from(bookings).where(eq(bookings.id, params.id)).limit(1);
  if (!row || !h || row.helperId !== h.id) return NextResponse.json({ error: "Not found or not assigned to you" }, { status: 404 });
  if (row.status !== "ASSIGNED") return NextResponse.json({ error: "Can go on the way only when ASSIGNED" }, { status: 400 });
  await db.insert(auditLogs).values({ actorId: user!.id, action: "helper_on_the_way", entity: "booking", entityId: row.id, before: { status: row.status }, after: { status: row.status, onTheWay: true } });
  return { ok: true, status: row.status, onTheWay: true };
}, { roles: ["HELPER"] });
