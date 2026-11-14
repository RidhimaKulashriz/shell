import { route, ApiError } from "@/lib/api";
import { db } from "@/db";
import { disputes, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notifyOps } from "@/lib/notify";
export const POST = route({ roles: ["CUSTOMER", "HELPER"] }, async ({ body, user }) => {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, String(body.taskId)));
  if (!t || (t.customerId !== user.id && t.helperId !== user.id)) throw new ApiError("not_found", "Job not found.", 404);
  const reason = ["Quality", "No show", "Late", "Damage", "Overcharge", "Safety", "Other"].includes(body.reason) ? body.reason : "Other";
  const [d] = await db.insert(disputes).values({ taskId: t.id, openedBy: user.id, reason, description: String(body.description ?? "").slice(0, 1500), slaDueAt: new Date(Date.now() + 24 * 3600000) }).returning();
  await notifyOps("dispute", `Dispute opened: ${reason}`, t.title, "/ops/disputes");
  return { id: d.id };
});
