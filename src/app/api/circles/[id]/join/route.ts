import { route } from "@/lib/api";
import { joinCircle } from "@/lib/requests";
export const POST = route<{ id: string }>({ roles: ["CUSTOMER"] }, async ({ params, user }) => joinCircle(params.id, user.id));
