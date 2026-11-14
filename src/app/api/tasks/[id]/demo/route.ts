import { route, ApiError } from "@/lib/api";
import { demoAdvance } from "@/lib/tasks";
import { getFlags } from "@/lib/settings";
export const POST = route<{ id: string }>({ limit: [60, 60000] }, async ({ params }) => {
  if (!(await getFlags()).demo_mode) throw new ApiError("disabled", "Demo controls are turned off.", 403);
  await demoAdvance(params.id);
  return { ok: true };
});
