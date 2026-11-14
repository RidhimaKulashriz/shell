import { route, ApiError } from "@/lib/api";
import { db } from "@/db";
import { circles, addresses, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { joinCircle } from "@/lib/requests";
export const POST = route({ roles: ["CUSTOMER"] }, async ({ body, user }) => {
  const [addr] = await db.select().from(addresses).where(eq(addresses.userId, user.id)).limit(1);
  if (!addr) throw new ApiError("no_address", "Add your address first.");
  const [cat] = await db.select().from(categories).where(eq(categories.slug, String(body.category ?? "house-cleaning")));
  const start = new Date(body.start); if (isNaN(start.getTime()) || start.getTime() < Date.now() + 6 * 3600000) throw new ApiError("bad_time", "Pick a time at least 6 hours from now.");
  const min = Math.max(2, Math.min(10, Number(body.minFlats) || 3)), max = Math.max(min, Math.min(12, Number(body.maxFlats) || 6));
  const [c] = await db.insert(circles).values({ societyId: addr.societyId, towerId: addr.towerId, categoryId: cat.id, title: String(body.title || `${cat.name} circle`).slice(0, 80), windowStart: start, windowEnd: new Date(start.getTime() + 3 * 3600000), cutoffAt: new Date(start.getTime() - 4 * 3600000), minFlats: min, maxFlats: max, createdBy: user.id }).returning();
  await joinCircle(c.id, user.id);
  return { id: c.id };
});
