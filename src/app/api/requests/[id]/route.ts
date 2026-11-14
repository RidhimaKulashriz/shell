import { route, ApiError } from "@/lib/api";
import { db } from "@/db";
import { requests, plans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
export const GET = route<{ id: string }>({ roles: ["CUSTOMER"] }, async ({ params, user }) => {
  const [r] = await db.select().from(requests).where(eq(requests.id, params.id));
  if (!r || r.customerId !== user.id) throw new ApiError("not_found", "Request not found.", 404);
  const [p] = await db.select().from(plans).where(eq(plans.requestId, r.id)).orderBy(desc(plans.createdAt)).limit(1);
  return { status: r.status, planId: p && p.status !== "draft" ? p.id : null };
});
