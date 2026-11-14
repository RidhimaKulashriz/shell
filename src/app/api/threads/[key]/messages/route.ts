import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { fraudAlerts, messages } from "@/db/schema";
import { AppError, api, body } from "@/lib/api";
import { scanMessage, LEAK_WARNING } from "@/lib/leakage";
import { and } from "drizzle-orm";
import { plans, tasks, helpers } from "@/db/schema";

async function canAccess(key: string, userId: string, role: string) {
  if (role === "OPS" || role === "SUPER_ADMIN") return true;
  const [scope, ref] = key.split(":");
  if (scope === "support") return ref === userId;
  if (scope === "plan") {
    const [p] = await db.select().from(plans).where(eq(plans.id, ref)).limit(1);
    return p?.customerId === userId;
  }
  if (scope === "task") {
    const [t] = await db.select().from(tasks).where(eq(tasks.id, ref)).limit(1);
    if (!t) return false;
    const [p] = await db.select().from(plans).where(eq(plans.id, t.planId)).limit(1);
    if (p?.customerId === userId) return true;
    const [h] = await db.select().from(helpers).where(and(eq(helpers.userId, userId))).limit(1);
    return !!h && t.assignedHelperId === h.id;
  }
  return false;
}

export const GET = api<{ key: string }>(async ({ params, user }) => {
  const key = decodeURIComponent(params.key);
  if (!(await canAccess(key, user!.id, user!.role))) throw new AppError(403, "forbidden", "No access to this chat.");
  return { messages: await db.select().from(messages).where(eq(messages.threadKey, key)).orderBy(asc(messages.createdAt)).limit(200) };
}, { roles: ["CUSTOMER", "HELPER", "OPS"] });

export const POST = api<{ key: string }>(async ({ req, params, user }) => {
  const key = decodeURIComponent(params.key);
  if (!(await canAccess(key, user!.id, user!.role))) throw new AppError(403, "forbidden", "No access to this chat.");
  const b = await body(req, z.object({ body: z.string().trim().min(1).max(1000), type: z.enum(["text", "voice", "photo"]).default("text") }));
  const scan = key.startsWith("support:") && user!.role !== "CUSTOMER" ? { hit: false, flags: [] as string[], redacted: b.body } : scanMessage(b.body);
  const [m] = await db.insert(messages).values({ threadKey: key, senderId: user!.id, senderRole: user!.role === "OPS" || user!.role === "SUPER_ADMIN" ? "OPS" : user!.role, type: b.type, body: scan.hit ? scan.redacted : b.body, leakFlags: scan.flags, blurred: scan.hit }).returning();
  if (scan.hit) await db.insert(fraudAlerts).values({ type: scan.flags.includes("upi") || scan.flags.includes("offplatform_payment") ? "upi_in_chat" : "phone_in_chat", severity: "medium", refType: "message", refId: m.id, evidence: { flags: scan.flags, thread: key, sender: user!.name } });
  return { message: m, warning: scan.hit ? LEAK_WARNING : null };
}, { roles: ["CUSTOMER", "HELPER", "OPS"], limit: { key: "chat", max: 60, windowMs: 60000 } });
