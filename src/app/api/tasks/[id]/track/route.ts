import { desc, eq, lte, and } from "drizzle-orm";
import { db } from "@/db";
import { addresses, helpers, locationPings, plans, tasks, towers } from "@/db/schema";
import { AppError, api, need } from "@/lib/api";
import { computeEta } from "@/lib/eta";
import { haversine, rideMinutes, walkMinutes } from "@/lib/geo";
import { readinessPct } from "@/lib/statemachine";

async function snapshot(taskId: string, userId: string, isOps: boolean) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  need(t, "Task");
  const [plan] = await db.select().from(plans).where(eq(plans.id, t.planId)).limit(1);
  if (plan.customerId !== userId && !isOps) throw new AppError(403, "forbidden", "Not your task");
  const sibling = await db.select({ s: tasks.status }).from(tasks).where(eq(tasks.planId, plan.id));
  const active = ["en_route", "arrived", "in_progress"].includes(t.status);
  let helper: { name: string; lat: number; lng: number } | null = null;
  let eta: ReturnType<typeof computeEta> | null = null;
  let line = "";
  if (t.assignedHelperId) {
    const [h] = await db.select().from(helpers).where(eq(helpers.id, t.assignedHelperId)).limit(1);
    // privacy: customers see a smoothed position delayed by 5 seconds, and only during an active job
    const [ping] = active ? await db.select().from(locationPings).where(and(eq(locationPings.taskId, t.id), lte(locationPings.ts, new Date(Date.now() - 5000)))).orderBy(desc(locationPings.ts)).limit(1) : [];
    const pos = ping ? { lat: ping.lat, lng: ping.lng } : h.lat != null ? { lat: h.lat, lng: h.lng! } : null;
    if (pos && (active || t.status === "accepted")) {
      helper = { name: h.displayName.split(" ")[0], ...pos };
      const [addr] = plan.addressId ? await db.select().from(addresses).where(eq(addresses.id, plan.addressId)).limit(1) : [];
      const [tw] = addr?.towerId ? await db.select().from(towers).where(eq(towers.id, addr.towerId)).limit(1) : [];
      if (addr?.lat != null) {
        const d = haversine(pos, { lat: addr.lat, lng: addr.lng! });
        eta = computeEta({ travelMin: d > 400 ? rideMinutes(d - 300) : 0, gateWaitMin: d > 150 ? 2.5 : 0, walkMin: d > 80 ? walkMinutes(Math.min(d, 300)) : 0, floor: addr.floor });
        line = `${helper.name} is ${d < 150 ? "at your tower" : "on the way"}, about ${eta.total} min, ${tw?.name ?? "your tower"} floor ${addr.floor}`;
      }
    }
  }
  return { status: t.status, name: t.name, readiness: readinessPct(sibling.map((s) => s.s)), checklistDone: t.checklist.filter((c) => c.done).length, checklistTotal: t.checklist.length, helper, eta, line, sharing: active, ts: Date.now() };
}

export const GET = api<{ id: string }>(async ({ req, params, user }) => {
  const isOps = user!.role === "OPS" || user!.role === "SUPER_ADMIN";
  if (new URL(req.url).searchParams.get("once")) return snapshot(params.id, user!.id, isOps);
  const enc = new TextEncoder();
  let n = 0;
  let timer: ReturnType<typeof setInterval>;
  const stream = new ReadableStream({
    async start(c) {
      const send = async () => {
        try {
          c.enqueue(enc.encode(`data: ${JSON.stringify(await snapshot(params.id, user!.id, isOps))}\n\n`));
        } catch {
          clearInterval(timer);
          c.close();
        }
        if (++n > 40) { clearInterval(timer); c.close(); }
      };
      await send();
      timer = setInterval(send, 4000);
    },
    cancel() { clearInterval(timer); },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive" } });
}, { roles: ["CUSTOMER", "OPS"] });
