import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { helpers, offers, plans, tasks } from "@/db/schema";
import { AppError, api, body, need } from "@/lib/api";
import { logEvent } from "@/lib/plans";
import { notify } from "@/lib/notify";
import { doorOtpHash } from "@/lib/otp";

export const POST = api<{ id: string; action: string }>(async ({ req, params, user }) => {
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user!.id)).limit(1);
  need(h, "Helper");
  const [o] = await db.select().from(offers).where(and(eq(offers.id, params.id), eq(offers.helperId, h.id))).limit(1);
  need(o, "Offer");
  if (o.status !== "sent") throw new AppError(409, "closed", "This offer is no longer open.");
  if (o.expiresAt && o.expiresAt < new Date()) {
    await db.update(offers).set({ status: "expired" }).where(eq(offers.id, o.id));
    throw new AppError(410, "expired", "This offer expired.", "यह ऑफ़र ख़त्म हो गया।");
  }
  if (params.action === "decline") {
    const b = await body(req, z.object({ reason: z.string().max(40).optional() }));
    await db.update(offers).set({ status: "declined", respondedAt: new Date(), reason: b.reason ?? null }).where(eq(offers.id, o.id));
    return { ok: true };
  }
  if (params.action === "accept") {
    if (h.status !== "active") throw new AppError(403, "inactive", "Your account is not active yet.");
    const [t] = await db.select().from(tasks).where(eq(tasks.id, o.taskId)).limit(1);
    need(t, "Task");
    if (t.assignedHelperId) throw new AppError(409, "taken", "Someone else already accepted this job.", "यह काम किसी और ने ले लिया।");
    await db.update(tasks).set({ assignedHelperId: h.id, status: "accepted", doorOtpHash: doorOtpHash(t.id), updatedAt: new Date() }).where(eq(tasks.id, t.id));
    await db.update(offers).set({ status: "accepted", respondedAt: new Date() }).where(eq(offers.id, o.id));
    await db.update(offers).set({ status: "expired" }).where(and(eq(offers.taskId, t.id), ne(offers.id, o.id), eq(offers.status, "sent")));
    const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId)).limit(1);
    await logEvent(t.id, t.planId, "helper_assigned", { helper: h.displayName }, user!.id);
    await notify(plan.customerId, "helper_assigned", { helper: h.displayName.split(" ")[0], task: t.name });
    return { ok: true, taskId: t.id };
  }
  throw new AppError(404, "not_found", "Unknown action");
}, { roles: ["HELPER"] });
