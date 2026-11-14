import { route, ApiError } from "@/lib/api";
import { db } from "@/db";
import { messages, tasks, plans, users } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { scanMessage } from "@/lib/scanner";
import { notify, notifyOps } from "@/lib/notify";

async function canAccess(key: string, userId: string, role: string) {
  if (role === "OPS" || role === "SUPER_ADMIN") return true;
  const [kind, ref] = key.split(":");
  if (kind === "support") return ref === userId;
  if (kind === "task") { const [t] = await db.select().from(tasks).where(eq(tasks.id, ref)); return !!t && (t.customerId === userId || t.helperId === userId); }
  if (kind === "plan") { const [p] = await db.select().from(plans).where(eq(plans.id, ref)); return !!p && p.customerId === userId; }
  return false;
}
export const GET = route<{ key: string }>({}, async ({ params, user }) => {
  const key = decodeURIComponent(params.key);
  if (!(await canAccess(key, user.id, user.role))) throw new ApiError("forbidden", "You can't view this chat.", 403);
  const rows = await db.select({ m: messages, name: users.name, role: users.role }).from(messages).leftJoin(users, eq(users.id, messages.senderId)).where(eq(messages.threadKey, key)).orderBy(asc(messages.createdAt));
  return { me: user.id, messages: rows.map(({ m, name, role }) => ({ id: m.id, body: m.body, blurred: m.blurred, flags: m.leakFlags, at: m.createdAt, mine: m.senderId === user.id, who: m.senderId ? `${(name ?? "").split(" ")[0] || "User"}${role === "OPS" ? " (Shell)" : ""}` : "Shell" })) };
});
export const POST = route<{ key: string }>({ limit: [30, 60000] }, async ({ params, body, user }) => {
  const key = decodeURIComponent(params.key);
  if (!(await canAccess(key, user.id, user.role))) throw new ApiError("forbidden", "You can't post here.", 403);
  const text = String(body.body ?? "").trim().slice(0, 1000);
  if (!text) throw new ApiError("empty", "Write a message first.");
  const scan = scanMessage(text);
  await db.insert(messages).values({ threadKey: key, senderId: user.id, body: scan.blurred ? scan.clean : text, leakFlags: scan.flags, blurred: scan.blurred });
  if (scan.flags.length) await notifyOps("leakage", "Possible off-platform contact", `${scan.flags.join(", ")} in ${key}`, "/ops/fraud");
  const [kind, ref] = key.split(":");
  if (kind === "task") { const [t] = await db.select().from(tasks).where(eq(tasks.id, ref)); const other = t && (t.customerId === user.id ? t.helperId : t.customerId); if (other) await notify(other, "message", "New message", text.slice(0, 60), user.id === t?.customerId ? `/helper/jobs/${ref}` : `/app/orders/${ref}`); }
  return { ok: true, warned: scan.flags.length > 0, message: scan.flags.length ? "For your protection we hid contact details. Keep chats and payments inside Shell so your Guarantee stays valid." : undefined };
});
