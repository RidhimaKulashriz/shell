import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { addresses, circleMembers, circles, taskTemplates } from "@/db/schema";
import { AppError, api, body, need } from "@/lib/api";
import { activePricing } from "@/lib/data";
import { circleDiscount } from "@/lib/pricing";
import { nextCircleStatus } from "@/lib/statemachine";
import { notify } from "@/lib/notify";

export const GET = api(async ({ user }) => {
  const [addr] = await db.select().from(addresses).where(eq(addresses.userId, user!.id)).orderBy(desc(addresses.createdAt)).limit(1);
  const cfg = await activePricing();
  const list = addr ? await db.select().from(circles).where(and(eq(circles.societyId, addr.societyId), inArray(circles.status, ["open", "filling", "confirmed", "full"]))).orderBy(desc(circles.createdAt)) : [];
  const mine = await db.select().from(circleMembers).where(eq(circleMembers.userId, user!.id));
  return { circles: list.map((c) => ({ ...c, joined: mine.some((m) => m.circleId === c.id), pricePerFlat: Math.round((c.basePrice * (1 - circleDiscount(c.currentFlats, cfg))) / 100) * 100 })), curve: cfg.circleCurve };
}, { roles: ["CUSTOMER"] });

export const POST = api(async ({ req, user }) => {
  const b = await body(req, z.object({ templateSlug: z.string(), towerId: z.string().uuid().optional(), windowStart: z.string().datetime(), hours: z.number().min(1).max(8).default(3), minFlats: z.number().int().min(2).max(10).default(3), maxFlats: z.number().int().min(2).max(12).default(6) }));
  const [addr] = await db.select().from(addresses).where(eq(addresses.userId, user!.id)).orderBy(desc(addresses.createdAt)).limit(1);
  if (!addr) throw new AppError(400, "no_address", "Add your flat first.");
  const [tpl] = await db.select().from(taskTemplates).where(eq(taskTemplates.slug, b.templateSlug)).limit(1);
  need(tpl, "Task");
  const start = new Date(b.windowStart);
  const code = "C" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const [c] = await db.insert(circles).values({ societyId: addr.societyId, towerId: b.towerId ?? addr.towerId, templateSlug: tpl.slug, title: `${tpl.nameEn} Circle`, windowStart: start, windowEnd: new Date(start.getTime() + b.hours * 3600000), cutoffAt: new Date(start.getTime() - 12 * 3600000), minFlats: b.minFlats, maxFlats: b.maxFlats, currentFlats: 1, basePrice: tpl.baseRate, inviteCode: code, createdBy: user!.id }).returning();
  await db.insert(circleMembers).values({ circleId: c.id, userId: user!.id, flat: addr.flat });
  return { id: c.id, inviteCode: code, link: `/circle/${code}` };
}, { roles: ["CUSTOMER"] });
