import { route } from "@/lib/api";
import { act } from "@/lib/tasks";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { audit } from "@/lib/settings";
export const POST = route<{ id: string; action: string }>({ limit: [60, 60000] }, async ({ params, body, user }) => {
  const r = await act(params.id, params.action, { id: user.id, role: user.role }, body);
  if (user.role === "OPS" || user.role === "SUPER_ADMIN") await audit(user.id, `task.${params.action}`, "task", params.id, null, body);
  void db; void tasks; void eq;
  return r;
});
