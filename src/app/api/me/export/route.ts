import { route } from "@/lib/api";
import { db } from "@/db";
import { addresses, customerProfiles, plans, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
export const GET = route({}, async ({ user }) => {
  const data = { user, addresses: await db.select().from(addresses).where(eq(addresses.userId, user.id)), profile: (await db.select().from(customerProfiles).where(eq(customerProfiles.userId, user.id)))[0] ?? null, plans: await db.select().from(plans).where(eq(plans.customerId, user.id)), tasks: await db.select().from(tasks).where(eq(tasks.customerId, user.id)) };
  return new Response(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json", "content-disposition": "attachment; filename=shell-my-data.json" } });
});
