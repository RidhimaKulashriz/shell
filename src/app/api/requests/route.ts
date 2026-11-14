import { route } from "@/lib/api";
import { createRequest } from "@/lib/requests";
export const POST = route({ roles: ["CUSTOMER"], limit: [20, 60000] }, async ({ body, user }) => createRequest(user.id, {
  text: String(body.text ?? "").slice(0, 2000), deadlineAt: body.deadlineAt || null, urgency: ["normal", "same_day", "rush"].includes(body.urgency) ? body.urgency : "normal",
  packSlug: body.packSlug || null, photos: Array.isArray(body.photos) ? body.photos.filter((p: unknown) => typeof p === "string" && p.length < 600000).slice(0, 5) : [], circleId: body.circleId || null,
}));
