import { route, ApiError } from "@/lib/api";
import { db } from "@/db";
import { requests, plans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { finalizeRequest } from "@/lib/requests";
export const POST = route<{ id: string }>({ roles: ["CUSTOMER"] }, async ({ params, body, user }) => {
  const [r] = await db.select().from(requests).where(eq(requests.id, params.id));
  if (!r || r.customerId !== user.id) throw new ApiError("not_found", "Request not found.", 404);
  if (r.status !== "clarifying") throw new ApiError("invalid_state", "This request is no longer waiting for answers.");
  const answers = { ...r.answers, [String(body.key)]: String(body.value ?? "skip").slice(0, 200) };
  const done = r.questions.every((q) => answers[q.key]);
  await db.update(requests).set({ answers, updatedAt: new Date() }).where(eq(requests.id, r.id));
  if (!done) return { done: false };
  const planId = await finalizeRequest(r.id);
  const [p] = await db.select().from(plans).where(eq(plans.id, planId));
  return { done: true, planId, status: p.status };
});
