import { api } from "@/lib/api";
import { hexCounts } from "@/lib/site-data";

// Privacy-safe: hex ids and counts only, hexes with fewer than 3 people are suppressed.
export const GET = api(async () => ({ hexes: await hexCounts(3) }));
