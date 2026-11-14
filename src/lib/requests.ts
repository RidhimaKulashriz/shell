import { db } from "@/db";
import { requests, plans, packs, addresses, circles, circleMembers, tasks, categories } from "@/db/schema";
import type { DraftLine } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { CATALOG } from "./catalog";
import { applyAnswers, draftFromText, questionsFor } from "./engine";
import { writePlan } from "./plans";
import { getFlags } from "./settings";
import { notify, notifyOps } from "./notify";
import { ApiError } from "./api";
import type { Urgency } from "./pricing";

export async function createRequest(userId: string, o: { text: string; deadlineAt?: string | null; urgency?: Urgency; packSlug?: string | null; photos?: string[]; circleId?: string | null }) {
  const [addr] = await db.select().from(addresses).where(eq(addresses.userId, userId)).limit(1);
  if (!addr) throw new ApiError("no_address", "Please add your address first.");
  let lines: DraftLine[] = []; let banned: string | null = null;
  const text = (o.text ?? "").trim();
  if (o.packSlug) {
    const [pk] = await db.select().from(packs).where(eq(packs.slug, o.packSlug));
    if (!pk) throw new ApiError("not_found", "Pack not found.", 404);
    lines = pk.items.map((i) => ({ slug: i.slug, quantity: i.quantity, size: "medium", confidence: 1, note: i.note }));
  } else {
    if (text.length < 3 && !(o.photos?.length)) throw new ApiError("empty", "Tell us what you need done.");
    const r = draftFromText(text, CATALOG);
    lines = r.lines; banned = r.banned;
    if (!lines.length && !banned && o.photos?.length) {
      // Photo-to-plan (mock vision): suggests the most common tasks at low confidence, which routes to a human.
      lines = [{ slug: "house-cleaning", quantity: 3, size: "medium", confidence: 0.5 }, { slug: "wardrobe-organising", quantity: 1, size: "medium", confidence: 0.45 }];
    }
  }
  const urgency = o.urgency ?? "normal";
  const qs = o.packSlug ? [] : questionsFor(lines, CATALOG, text);
  const [req] = await db.insert(requests).values({
    customerId: userId, addressId: addr.id, rawText: text || (o.packSlug ? `Pack: ${o.packSlug}` : "Photo request"), photos: o.photos ?? [], deadlineAt: o.deadlineAt ? new Date(o.deadlineAt) : null,
    urgency, status: banned ? "cancelled" : qs.length ? "clarifying" : "drafting", draft: lines, questions: qs, packSlug: o.packSlug ?? null, circleId: o.circleId ?? null,
    rejectedReason: banned ? `We don't offer "${banned}". Shell doesn't do massage, makeup, personal care or homework.` : null,
  }).returning();
  if (banned) return { id: req.id, status: "cancelled" };
  if (!lines.length) {
    await db.update(requests).set({ status: "in_review", slaDueAt: new Date(Date.now() + 15 * 60000) }).where(eq(requests.id, req.id));
    await notifyOps("request", "New request needs a plan", text.slice(0, 80), `/ops/requests/${req.id}`);
    return { id: req.id, status: "in_review" };
  }
  if (!qs.length) await finalizeRequest(req.id);
  return { id: req.id, status: qs.length ? "clarifying" : "done" };
}

export async function finalizeRequest(requestId: string) {
  const [req] = await db.select().from(requests).where(eq(requests.id, requestId));
  if (!req) throw new ApiError("not_found", "Request not found.", 404);
  const lines = applyAnswers(req.draft, req.answers, CATALOG);
  const flags = await getFlags();
  const lowConfidence = lines.some((l) => l.confidence < 0.6);
  const review = flags.human_review || lowConfidence;
  let joiners = 1;
  if (req.circleId) { const [c] = await db.select().from(circles).where(eq(circles.id, req.circleId)); joiners = c?.currentFlats ?? 1; }
  const planId = await writePlan({
    requestId, customerId: req.customerId, lines, urgency: req.urgency as Urgency, deadline: req.deadlineAt, packSlug: req.packSlug, circleId: req.circleId, circleJoiners: joiners,
    status: review ? "draft" : "sent",
  });
  await db.update(requests).set({ draft: lines, status: review ? "in_review" : "plan_sent", slaDueAt: review ? new Date(Date.now() + 15 * 60000) : null, updatedAt: new Date() }).where(eq(requests.id, requestId));
  if (review) await notifyOps("request", "Plan waiting for review", req.rawText.slice(0, 80), `/ops/requests/${requestId}`);
  else await notify(req.customerId, "plan_ready", "Your plan is ready", "Take a look and approve when you're happy.", `/app/plans/${planId}`);
  return planId;
}

export async function sendPlan(planId: string, opsId: string, note?: string) {
  const [p] = await db.select().from(plans).where(eq(plans.id, planId));
  if (!p) throw new ApiError("not_found", "Plan not found.", 404);
  await db.update(plans).set({ status: "sent", opsNote: note ?? p.opsNote, updatedAt: new Date() }).where(eq(plans.id, planId));
  await db.update(requests).set({ status: "plan_sent", assignedOpsId: opsId, updatedAt: new Date() }).where(eq(requests.id, p.requestId));
  await notify(p.customerId, "plan_ready", "Your plan is ready", "A person on our team checked it. Take a look and approve.", `/app/plans/${planId}`);
}

export async function joinCircle(circleId: string, userId: string) {
  const [c] = await db.select().from(circles).where(eq(circles.id, circleId));
  if (!c) throw new ApiError("not_found", "Circle not found.", 404);
  if (["cancelled", "full"].includes(c.status)) throw new ApiError("closed", "This Circle is closed.");
  const [dup] = await db.select().from(circleMembers).where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));
  if (dup) throw new ApiError("joined", "You've already joined this Circle.");
  const [addr] = await db.select().from(addresses).where(eq(addresses.userId, userId)).limit(1);
  if (!addr || addr.towerId !== c.towerId) throw new ApiError("wrong_tower", "This Circle is for a different tower.");
  await db.insert(circleMembers).values({ circleId, userId, flat: addr.flat, paymentStatus: "pending" });
  const n = c.currentFlats + 1;
  const status = n >= c.maxFlats ? "full" : n >= c.minFlats ? "confirmed" : "filling";
  await db.update(circles).set({ currentFlats: n, status }).where(eq(circles.id, circleId));
  if (status === "confirmed" && c.status !== "confirmed") await notify(c.createdBy, "circle_confirmed", "Your Circle is confirmed", `${c.title} reached ${c.minFlats} flats.`, "/app/circles");
  return { currentFlats: n, status };
}

void tasks; void categories;
