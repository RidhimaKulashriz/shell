import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, bookings, helpers } from "@/db/schema";
import { api } from "@/lib/api";

export const POST = api<{ id: string }>(async ({ params, user }) => {
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user!.id)).limit(1);
  const [row] = await db.select().from(bookings).where(eq(bookings.id, params.id)).limit(1);
  if (!row || !h || row.helperId !== h.id) return NextResponse.json({ error: "Not found or not assigned to you" }, { status: 404 });
  if (row.status !== "IN_PROGRESS") return NextResponse.json({ error: "Can complete only when IN_PROGRESS" }, { status: 400 });
  await db.update(bookings).set({ status: "COMPLETED" }).where(eq(bookings.id, row.id));
  await db.insert(auditLogs).values({ actorId: user!.id, action: "helper_complete", entity: "booking", entityId: row.id, before: { status: row.status }, after: { status: "COMPLETED" } });
  return { ok: true, status: "COMPLETED" };
}, { roles: ["HELPER"] });
