import { route } from "@/lib/api";
import { publicStats, societySearch, hexCells } from "@/lib/stats";
export const GET = route({}, async ({ req }) => {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return { items: await societySearch(q.slice(0, 60)), stats: await publicStats(), cells: await hexCells() };
}, true);
