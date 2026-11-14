import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, circleMembers, circles } from "@/db/schema";
import { AppError, need } from "@/lib/api";
import { activePricing } from "@/lib/data";
import { circleDiscount } from "@/lib/pricing";
import { nextCircleStatus } from "@/lib/statemachine";
import { notify } from "@/lib/notify";

export async function joinCircle(circleId: string, userId: string) {
  const [c] = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1);
  need(c, "Circle");
  if (["cancelled", "full"].includes(c.status)) throw new AppError(409, "closed", "This Circle is closed.");
  const [dup] = await db.select().from(circleMembers).where(and(eq(circleMembers.circleId, c.id), eq(circleMembers.userId, userId))).limit(1);
  if (dup) return c;
  const [addr] = await db.select().from(addresses).where(eq(addresses.userId, userId)).limit(1);
  await db.insert(circleMembers).values({ circleId: c.id, userId, flat: addr?.flat });
  const current = c.currentFlats + 1;
  const status = nextCircleStatus({ current, min: c.minFlats, max: c.maxFlats, cutoffAt: c.cutoffAt, status: c.status });
  await db.update(circles).set({ currentFlats: current, status }).where(eq(circles.id, c.id));
  if (status === "confirmed" && c.status !== "confirmed") {
    const members = await db.select().from(circleMembers).where(eq(circleMembers.circleId, c.id));
    const cfg = await activePricing();
    for (const m of members) await notify(m.userId, "circle_confirmed", { circle: c.title, price: Math.round((c.basePrice * (1 - circleDiscount(current, cfg))) / 100) });
  }
  return { ...c, currentFlats: current, status };
}
