import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { inArray } from "drizzle-orm";

// In-app inbox is real. WhatsApp / push providers plug in behind this function (see README: WHATSAPP_TOKEN).
export async function notify(userId: string, type: string, title: string, body = "", link?: string) {
  await db.insert(notifications).values({ userId, type, title, body, link });
}
export async function notifyOps(type: string, title: string, body = "", link = "/ops") {
  const ops = await db.select({ id: users.id }).from(users).where(inArray(users.role, ["OPS", "SUPER_ADMIN"]));
  if (ops.length) await db.insert(notifications).values(ops.map((o) => ({ userId: o.id, type, title, body, link })));
}
