import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { addresses, contactMessages, customerProfiles, disputes, notifications, payments, plans, reviews, routines, tasks, users } from "@/db/schema";
import { AppError, api, body, need } from "@/lib/api";
import { notify } from "@/lib/notify";

export const GET = api<{ what: string }>(async ({ params, user }) => {
  if (params.what === "notifications") return { notifications: await db.select().from(notifications).where(eq(notifications.userId, user!.id)).orderBy(desc(notifications.sentAt)).limit(50) };
  if (params.what === "export") {
    // DPDP data export
    const [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user!.id)).limit(1);
    const myPlans = await db.select().from(plans).where(eq(plans.customerId, user!.id));
    return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), user: { name: user!.name, phone: user!.phone, language: user!.language }, profile, addresses: await db.select().from(addresses).where(eq(addresses.userId, user!.id)), plans: myPlans, payments: await db.select().from(payments).where(eq(payments.customerId, user!.id)), reviews: await db.select().from(reviews).where(eq(reviews.fromUserId, user!.id)) }, null, 2), { headers: { "content-type": "application/json", "content-disposition": "attachment; filename=shell-my-data.json" } });
  }
  throw new AppError(404, "not_found", "Unknown resource");
}, { roles: ["CUSTOMER", "HELPER"] });

export const POST = api<{ what: string }>(async ({ req, params, user }) => {
  switch (params.what) {
    case "read-notifications":
      await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.userId, user!.id));
      return { ok: true };
    case "disputes": {
      const b = await body(req, z.object({ taskId: z.string().uuid(), reason: z.enum(["quality", "no_show", "late", "damage", "overcharge", "safety", "other"]), description: z.string().max(800).default(""), evidence: z.array(z.object({ kind: z.string(), url: z.string().max(400000).optional(), text: z.string().max(400).optional() })).max(8).default([]) }));
      const [t] = await db.select().from(tasks).where(eq(tasks.id, b.taskId)).limit(1);
      need(t, "Task");
      const [p] = await db.select().from(plans).where(and(eq(plans.id, t.planId), eq(plans.customerId, user!.id))).limit(1);
      need(p, "Task");
      const [d] = await db.insert(disputes).values({ taskId: t.id, planId: p.id, openedBy: user!.id, reason: b.reason, description: b.description, evidence: b.evidence, slaDueAt: new Date(Date.now() + 24 * 3600000) }).returning({ id: disputes.id });
      await notify(user!.id, "dispute_opened", {});
      return { id: d.id, slaHours: 24 };
    }
    case "routines": {
      const b = await body(req, z.object({ templateSlug: z.string(), title: z.string().max(100), frequency: z.enum(["weekly", "fortnightly", "monthly"]), windowText: z.string().max(60), autoPay: z.boolean().default(false) }));
      const [r] = await db.insert(routines).values({ customerId: user!.id, ...b, nextRunAt: new Date(Date.now() + 7 * 86400000) }).returning({ id: routines.id });
      return { id: r.id };
    }
    case "callback": {
      await db.insert(contactMessages).values({ kind: "callback", name: user!.name || user!.phone, phone: user!.phone, message: "Customer asked for a call back" });
      return { ok: true };
    }
    default:
      throw new AppError(404, "not_found", "Unknown action");
  }
}, { roles: ["CUSTOMER", "HELPER"] });

export const PATCH = api<{ what: string }>(async ({ req, params, user }) => {
  if (params.what !== "routines") throw new AppError(404, "not_found", "Unknown action");
  const b = await body(req, z.object({ id: z.string().uuid(), action: z.enum(["pause", "resume", "skip", "cancel"]) }));
  const patch = b.action === "pause" ? { status: "paused", pausedUntil: new Date(Date.now() + 14 * 86400000) } : b.action === "resume" ? { status: "active", pausedUntil: null } : b.action === "cancel" ? { status: "cancelled" } : { nextRunAt: new Date(Date.now() + 14 * 86400000) };
  await db.update(routines).set(patch).where(and(eq(routines.id, b.id), eq(routines.customerId, user!.id)));
  if (b.action === "skip") await notify(user!.id, "routine_skipped", { task: "routine" });
  return { ok: true };
}, { roles: ["CUSTOMER"] });

void users;
