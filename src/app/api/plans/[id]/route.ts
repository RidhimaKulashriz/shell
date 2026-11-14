import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { plans, tasks } from "@/db/schema";
import { AppError, api, body, need } from "@/lib/api";
import { repricePlan } from "@/lib/plans";

export const GET = api<{ id: string }>(async ({ params, user }) => {
  const [p] = await db.select().from(plans).where(and(eq(plans.id, params.id), eq(plans.customerId, user!.id))).limit(1);
  need(p, "Plan");
  return { plan: p, tasks: await db.select().from(tasks).where(eq(tasks.planId, p.id)) };
}, { roles: ["CUSTOMER"] });

/** Customer edits before paying: urgency toggle, remove a task. The price is always recomputed by the pricing engine. */
export const PATCH = api<{ id: string }>(async ({ req, params, user }) => {
  const b = await body(req, z.object({ urgency: z.enum(["normal", "same_day", "rush"]).optional(), removeTaskId: z.string().uuid().optional() }));
  const [p] = await db.select().from(plans).where(and(eq(plans.id, params.id), eq(plans.customerId, user!.id))).limit(1);
  need(p, "Plan");
  if (p.status !== "sent" && p.status !== "draft") throw new AppError(409, "locked", "This plan is already approved.");
  if (b.removeTaskId) await db.update(tasks).set({ status: "cancelled", cancelReason: "customer" }).where(and(eq(tasks.id, b.removeTaskId), eq(tasks.planId, p.id)));
  const q = await repricePlan(p.id, { urgency: b.urgency });
  return { total: q.total };
}, { roles: ["CUSTOMER"] });
