import { db } from "@/db";
import { categories, plans, tasks, requests, packs, type DraftLine } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { computePlan, type Size, type Urgency, type PriceLineInput } from "./pricing";
import { getPricing } from "./settings";
import { hmac } from "./auth";

export const doorOtp = (taskId: string) => (parseInt(hmac("otp:" + taskId).slice(0, 8), 16) % 9000 + 1000).toString();

const ORDER = ["groceries", "errands", "parcel-pickup", "house-cleaning", "utensils", "wardrobe-organising", "moving-help", "small-repairs", "decoration", "event-help"];

function istHour(d: Date) { return ((d.getUTCHours() * 60 + d.getUTCMinutes() + 330) / 60) % 24; }
function toWindow(d: Date) {
  // keep tasks between 8 am and 9 pm IST
  const h = istHour(d);
  if (h >= 8 && h < 21) return d;
  const x = new Date(d);
  const add = h >= 21 ? (24 - h + 8) : (8 - h);
  x.setUTCMinutes(x.getUTCMinutes() + Math.round(add * 60));
  return x;
}

export function schedule(durations: number[], slugs: string[], deadline: Date | null, urgency: Urgency, offsets?: Record<string, number>) {
  const now = Date.now();
  const gap = 20; // minutes of travel buffer between stops
  const starts: Date[] = [];
  if (deadline && offsets && Object.keys(offsets).length) {
    slugs.forEach((s, i) => starts.push(new Date(deadline.getTime() - ((offsets[s] ?? 3) * 60 + durations[i]) * 60000)));
  } else if (deadline) {
    const total = durations.reduce((a, b) => a + b, 0) + gap * (durations.length - 1);
    let cursor = deadline.getTime() - (total + 90) * 60000;
    durations.forEach((d) => { starts.push(new Date(cursor)); cursor += (d + gap) * 60000; });
  } else {
    let cursor = now + (urgency === "rush" ? 20 : 3 * 60) * 60000;
    durations.forEach((d) => { starts.push(new Date(cursor)); cursor += (d + gap) * 60000; });
  }
  const earliest = now + (urgency === "rush" ? 15 : 60) * 60000;
  return starts.map((s, i) => {
    let st = s.getTime() < earliest ? new Date(earliest + i * (durations[0] + gap) * 60000) : s;
    if (urgency !== "rush") st = toWindow(st);
    return { start: st, end: new Date(st.getTime() + durations[i] * 60000) };
  });
}

export async function writePlan(opts: {
  planId?: string; requestId: string; customerId: string; lines: DraftLine[]; urgency: Urgency; promo?: string | null;
  circleJoiners?: number; title?: string; deadline?: Date | null; packSlug?: string | null; circleId?: string | null; status?: string; opsNote?: string | null; version?: number;
}) {
  const cats = await db.select().from(categories).where(eq(categories.active, true));
  const bySlug = new Map(cats.map((c) => [c.slug, c]));
  const valid = opts.lines.filter((l) => bySlug.has(l.slug) && !bySlug.get(l.slug)!.banned);
  const cfg = await getPricing();
  const priceInputs: PriceLineInput[] = valid.map((l) => {
    const c = bySlug.get(l.slug)!;
    return { slug: l.slug, name: c.name, kind: c.kind, rate: c.baseRate, mins: c.minutesPerUnit, quantity: Math.max(1, l.quantity), size: (l.size as Size) || "medium" };
  });
  const joiners = opts.circleJoiners ?? 1;
  const p = computePlan({ lines: priceInputs, urgency: opts.urgency, circleJoiners: joiners, promo: opts.promo, config: cfg });
  // order tasks logically
  const idx = valid.map((_, i) => i).sort((a, b) => ORDER.indexOf(valid[a].slug) - ORDER.indexOf(valid[b].slug));
  let offsets: Record<string, number> | undefined;
  if (opts.packSlug) {
    const [pk] = await db.select().from(packs).where(eq(packs.slug, opts.packSlug));
    offsets = pk ? Object.fromEntries(pk.items.map((i) => [i.slug, i.offsetHours])) : undefined;
  }
  const sched = schedule(idx.map((i) => p.lines[i].durationMin), idx.map((i) => valid[i].slug), opts.deadline ?? null, opts.urgency, offsets);
  const title = opts.title || (p.lines.length > 1 ? `${p.lines[0].name} and ${p.lines.length - 1} more` : p.lines[0]?.name ?? "Your plan");

  const values = {
    requestId: opts.requestId, customerId: opts.customerId, title, status: opts.status ?? "sent", urgency: opts.urgency,
    urgencyMultiplier: p.urgencyMultiplier, circleDiscount: p.circleDiscount, subtotal: p.subtotal, travelAmount: p.travel,
    platformFee: p.platformFee, coordinationFee: p.coordinationFee, minTopUp: p.minTopUp, promoDiscount: p.promoDiscount,
    promoCode: p.promoDiscount ? opts.promo?.toUpperCase() ?? null : null, total: p.total, pricingConfigVersion: cfg.version,
    deadlineAt: opts.deadline ?? null, circleId: opts.circleId ?? null, opsNote: opts.opsNote ?? null, updatedAt: new Date(),
  };
  let planId = opts.planId;
  if (planId) {
    await db.update(plans).set(values).where(eq(plans.id, planId));
    await db.delete(tasks).where(eq(tasks.planId, planId));
  } else {
    const [row] = await db.insert(plans).values({ ...values, version: opts.version ?? 1 }).returning({ id: plans.id });
    planId = row.id;
  }
  const taskRows = idx.map((origI, order) => {
    const l = valid[origI], pl = p.lines[origI], c = bySlug.get(l.slug)!;
    return {
      planId: planId!, customerId: opts.customerId, categoryId: c.id, title: c.name, quantity: pl.quantity, size: pl.size,
      durationEstMin: pl.durationMin, basePrice: pl.basePrice, price: pl.price, helperPayout: pl.helperPayout,
      scheduledStart: sched[order].start, scheduledEnd: sched[order].end, expensesCap: l.cap ?? 0, rush: opts.urgency === "rush",
      checklist: c.checklist.map((label) => ({ label, done: false })), notes: l.note ?? "",
    };
  });
  if (taskRows.length) await db.insert(tasks).values(taskRows);
  return planId!;
}

export async function planWithTasks(planId: string) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
  if (!plan) return null;
  const rows = await db.select().from(tasks).where(eq(tasks.planId, planId)).orderBy(tasks.scheduledStart);
  const cats = rows.length ? await db.select().from(categories).where(inArray(categories.id, rows.map((t) => t.categoryId))) : [];
  const catMap = new Map(cats.map((c) => [c.id, c]));
  return { plan, tasks: rows.map((t) => ({ ...t, category: catMap.get(t.categoryId)! })) };
}

/** Customer edits: change quantity, remove tasks, toggle urgency, apply promo. Re-prices the whole plan. */
export async function editPlan(planId: string, edit: { caps?: Record<string, number>; quantities?: Record<string, number>; remove?: string[]; urgency?: Urgency; promo?: string | null; addSlugs?: string[] }) {
  const data = await planWithTasks(planId);
  if (!data) throw new Error("not found");
  const { plan } = data;
  let lines: DraftLine[] = data.tasks
    .filter((t) => !(edit.remove ?? []).includes(t.id))
    .map((t) => ({ slug: t.category.slug, quantity: edit.quantities?.[t.id] ?? t.quantity, size: t.size, confidence: 1, cap: (edit.caps?.[t.id] ?? t.expensesCap) || undefined, note: t.notes }));
  for (const s of edit.addSlugs ?? []) if (!lines.find((l) => l.slug === s)) lines.push({ slug: s, quantity: 1, size: "medium", confidence: 1 });
  lines = lines.filter((l) => l.quantity > 0);
  const [req] = await db.select().from(requests).where(eq(requests.id, plan.requestId));
  let joiners = 1;
  if (plan.circleId) {
    const { circles } = await import("@/db/schema");
    const [c] = await db.select().from(circles).where(eq(circles.id, plan.circleId));
    joiners = c?.currentFlats ?? 1;
  }
  return writePlan({
    planId, requestId: plan.requestId, customerId: plan.customerId, lines, urgency: edit.urgency ?? (plan.urgency as Urgency),
    promo: edit.promo === undefined ? plan.promoCode : edit.promo, circleJoiners: joiners, title: plan.title, deadline: plan.deadlineAt,
    packSlug: req?.packSlug, circleId: plan.circleId, status: plan.status, opsNote: plan.opsNote,
  });
}

export async function openPlanFor(requestId: string) {
  const [p] = await db.select().from(plans).where(and(eq(plans.requestId, requestId), inArray(plans.status, ["sent", "approved", "draft"]))).limit(1);
  return p;
}
