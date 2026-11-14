import { and, asc, eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { addresses, expenses, helpers, photos, plans, reviews, societies, taskEvents, tasks, towers } from "@/db/schema";
import { Tracker, type TTask } from "@/components/app/Tracker";
import { requireUser } from "@/lib/auth";
import { doorOtp } from "@/lib/otp";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["CUSTOMER"]);
  const { id } = await params;
  const [plan] = await db.select().from(plans).where(and(eq(plans.id, id), eq(plans.customerId, user.id))).limit(1);
  if (!plan) notFound();
  if (plan.status === "sent") redirect(`/app/plans/${plan.id}`);
  const ts = await db.select().from(tasks).where(eq(tasks.planId, plan.id)).orderBy(asc(tasks.sequence));
  const ids = ts.map((t) => t.id);
  const [hs, ph, ex, ev, rv] = await Promise.all([
    db.select().from(helpers), ids.length ? db.select().from(photos).where(inArray(photos.taskId, ids)) : [], ids.length ? db.select().from(expenses).where(inArray(expenses.taskId, ids)) : [], ids.length ? db.select().from(taskEvents).where(inArray(taskEvents.taskId, ids)) : [], ids.length ? db.select().from(reviews).where(inArray(reviews.taskId, ids)) : [],
  ]);
  const tasksV: TTask[] = ts.filter((t) => t.status !== "cancelled").map((t) => {
    const h = hs.find((x) => x.id === t.assignedHelperId);
    const e = ex.find((x) => x.taskId === t.id);
    return { id: t.id, name: t.name, status: t.status, price: t.price, start: t.scheduledStart?.toISOString() ?? null,
      helper: h ? { name: h.displayName, level: h.level, rating: h.ratingAvg, jobsDone: h.jobsDone, languages: h.languages, goodAt: h.goodAt, voiceIntro: h.voiceIntroText ?? "" } : null,
      checklist: t.checklist.map((c) => ({ label: c.label, done: c.done })), otp: ["accepted", "en_route", "arrived"].includes(t.status) ? doorOtp(t.id) : null,
      before: ph.find((p) => p.taskId === t.id && p.kind === "before")?.url ?? null, after: ph.find((p) => p.taskId === t.id && p.kind === "after")?.url ?? null,
      expense: e ? { cap: e.cap, spent: e.spent, status: e.status, items: e.ocrItems } : null,
      changes: ev.filter((x) => x.taskId === t.id && x.kind === "change_requested" && (x.detail as { status?: string }).status === "pending").map((x) => ({ id: x.id, kind: String((x.detail as { kind?: string }).kind), minutes: Number((x.detail as { minutes?: number }).minutes ?? 0), delta: Number((x.detail as { delta?: number }).delta ?? 0) })),
      reviewed: rv.some((r) => r.taskId === t.id), canRework: t.reworkCount < 1 };
  });
  const [addr] = plan.addressId ? await db.select().from(addresses).where(eq(addresses.id, plan.addressId)).limit(1) : [];
  const [soc] = addr ? await db.select().from(societies).where(eq(societies.id, addr.societyId)).limit(1) : [];
  const tw = soc ? await db.select().from(towers).where(eq(towers.societyId, soc.id)) : [];
  const myTower = tw.find((t) => t.id === addr?.towerId);
  return <Tracker plan={{ id: plan.id, title: plan.title, deadlineAt: plan.deadlineAt?.toISOString() ?? null }} tasks={tasksV} shareToken={plan.shareToken} map={{ boundary: soc?.boundary ?? [], gates: soc?.gates ?? [], towers: tw.map((t) => ({ name: t.name, lat: t.lat, lng: t.lng })), me: addr?.lat != null ? { lat: addr.lat, lng: addr.lng!, tower: myTower?.name ?? "" } : null }} />;
}
