import { route, ApiError } from "@/lib/api";
import { db } from "@/db";
import { locationPings, tasks, helperProfiles, taskEvents } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

// Batched pings. Tracking only runs during an active job.
export const POST = route({ roles: ["HELPER"], limit: [60, 60000] }, async ({ body, user }) => {
  const [t] = await db.select().from(tasks).where(and(eq(tasks.id, String(body.taskId)), eq(tasks.helperId, user.id), inArray(tasks.status, ["en_route", "arrived", "in_progress", "rework"])));
  if (!t) throw new ApiError("no_active_job", "Tracking only runs during an active job.");
  const pings = (Array.isArray(body.pings) ? body.pings : []).slice(0, 20).filter((p: any) => typeof p.lat === "number" && typeof p.lng === "number");
  if (!pings.length) return { ok: true };
  await db.insert(locationPings).values(pings.map((p: any) => ({ helperId: user.id, taskId: t.id, lat: p.lat, lng: p.lng, accuracy: p.accuracy ?? null, speed: p.speed ?? null, battery: p.battery ?? null })));
  const last = pings[pings.length - 1];
  await db.update(helperProfiles).set({ lat: last.lat, lng: last.lng }).where(eq(helperProfiles.userId, user.id));
  const bad = pings.find((p: any) => p.mock === true || (p.accuracy ?? 0) > 150 || (p.speed ?? 0) > 40);
  if (bad) await db.insert(taskEvents).values({ taskId: t.id, type: "gps_anomaly", actorId: user.id, note: bad.mock ? "Mock location flagged" : (bad.speed ?? 0) > 40 ? "Impossible speed" : "Low GPS accuracy" });
  return { ok: true };
});
