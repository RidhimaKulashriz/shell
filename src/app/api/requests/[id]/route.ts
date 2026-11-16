import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { plans, requests } from "@/db/schema";
import { api, body, need } from "@/lib/api";
import { applyAnswers, type Draft } from "@/lib/plan-engine";

export const GET = api<{ id: string }>(async ({ params, user }) => {
  const [r] = await db.select().from(requests).where(and(eq(requests.id, params.id), eq(requests.customerId, user!.id))).limit(1);
  need(r, "Request");
  const [plan] = await db.select().from(plans).where(and(eq(plans.requestId, r.id), eq(plans.status, "sent"))).limit(1);
  return { request: r, planId: plan?.id ?? null };
}, { roles: ["CUSTOMER"] });

/** Answer clarifying questions one at a time. `skip: true` means "skip, you decide" for all remaining ones. */
export const POST = api<{ id: string }>(async ({ req, params, user }) => {
  const b = await body(req, z.object({ questionId: z.string().optional(), answer: z.string().max(200).optional(), skip: z.boolean().optional() }));
  const [r] = await db.select().from(requests).where(and(eq(requests.id, params.id), eq(requests.customerId, user!.id))).limit(1);
  need(r, "Request");
  const qs = r.questions.map((q) => (q.id === b.questionId && b.answer ? { ...q, answer: b.answer } : q));
  const pending = qs.filter((q) => !q.answer);
  const done = b.skip || pending.length === 0;
  const answers = Object.fromEntries(qs.filter((q) => q.answer).map((q) => [q.id, q.answer!]));
  const draft = done && r.draft ? applyAnswers(r.draft as Draft, answers) : r.draft;
  await db.update(requests).set({ questions: qs, draft, status: done ? "in_review" : "clarifying", slaDueAt: done ? new Date(Date.now() + 15 * 60000) : r.slaDueAt, updatedAt: new Date() }).where(eq(requests.id, r.id));
  return { done, remaining: b.skip ? 0 : pending.length, next: done ? null : pending[0] };
}, { roles: ["CUSTOMER"] });
