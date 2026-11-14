import { route, ApiError } from "@/lib/api";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { editPlan } from "@/lib/plans";
import { getPricing } from "@/lib/settings";
export const POST = route<{ id: string }>({ roles: ["CUSTOMER"] }, async ({ params, body, user }) => {
  const [p] = await db.select().from(plans).where(eq(plans.id, params.id));
  if (!p || p.customerId !== user.id) throw new ApiError("not_found", "Plan not found.", 404);
  if (p.status !== "sent") throw new ApiError("locked", "This plan can't be edited anymore.");
  if (body.promo) { const cfg = await getPricing(); if (!cfg.promos[String(body.promo).toUpperCase()]) throw new ApiError("bad_promo", "That promo code isn't valid."); }
  await editPlan(p.id, { caps: body.caps, quantities: body.quantities, remove: body.remove, urgency: body.urgency, promo: body.promo === "" ? null : body.promo, addSlugs: body.addSlugs });
  return { ok: true };
});
