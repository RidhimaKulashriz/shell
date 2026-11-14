import { api } from "@/lib/api";
import { publicCounters } from "@/lib/data";
import { societyList } from "@/lib/site-data";

export const GET = api(async () => {
  const [counters, societies] = await Promise.all([publicCounters(), societyList()]);
  return { ...counters, societies: societies.map((s) => ({ slug: s.slug, name: s.name, count: s.count, target: s.target, remaining: Math.max(0, s.target - s.count) })) };
});
