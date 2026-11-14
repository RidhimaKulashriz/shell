import { route } from "@/lib/api";
import { audit } from "@/lib/settings";
export const POST = route({ limit: [60, 60000] }, async ({ body, user }) => {
  await audit(user?.id ?? null, `event:${String(body.name ?? "unknown").slice(0, 40)}`, "event", String(body.path ?? "").slice(0, 80), null, body.props ?? null);
  return { ok: true };
}, true);
