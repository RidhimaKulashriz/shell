import { db } from "@/db";
import { auditLogs } from "@/db/schema";

/** Append-only audit trail: every admin action, money and permission change, and every staff access to location data or IDs. */
export async function audit(a: { actorId?: string | null; action: string; entity: string; entityId?: string | null; before?: unknown; after?: unknown; req?: Request }) {
  await db.insert(auditLogs).values({
    actorId: a.actorId ?? null,
    action: a.action,
    entity: a.entity,
    entityId: a.entityId ?? null,
    before: (a.before ?? null) as never,
    after: (a.after ?? null) as never,
    ip: a.req?.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
    userAgent: a.req?.headers.get("user-agent")?.slice(0, 200) ?? null,
  });
}
