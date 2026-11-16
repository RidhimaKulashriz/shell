import { api } from "@/lib/api";
import { joinCircle } from "@/lib/circles";

export const POST = api<{ id: string }>(async ({ params, user }) => {
  const c = await joinCircle(params.id, user!.id);
  return { ok: true, circle: c };
}, { roles: ["CUSTOMER"] });
