import { route, ApiError } from "@/lib/api";
import { createSession, homeFor } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getFlags } from "@/lib/settings";

const DEMO: Record<string, string> = { customer: "+919810000001", helper: "+919810000101", ops: "+919810000900", society: "+919810000800", neighbour: "+919810000002" };
export const POST = route({ limit: [20, 60000] }, async ({ body }) => {
  const flags = await getFlags();
  if (!flags.demo_mode) throw new ApiError("disabled", "Demo accounts are turned off.", 403);
  const phone = DEMO[String(body.role)];
  if (!phone) throw new ApiError("bad_role", "Unknown demo role.");
  const [u] = await db.select().from(users).where(eq(users.phone, phone));
  if (!u) throw new ApiError("not_found", "Demo data is not set up yet. Please try again in a moment.");
  await createSession(u.id);
  return { ok: true, next: homeFor(u.role) };
}, true);
