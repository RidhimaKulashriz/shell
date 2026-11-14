import type { MetadataRoute } from "next";
import { db } from "@/db";
import { contentPosts, packs, taskCategories } from "@/db/schema";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, ps, posts] = await Promise.all([db.select({ s: taskCategories.slug }).from(taskCategories), db.select({ s: packs.slug }).from(packs), db.select({ s: contentPosts.slug }).from(contentPosts)]);
  const fixed = ["", "/how-it-works", "/services", "/services/quick", "/services/managed", "/services/routines", "/services/plus", "/packs", "/pricing", "/safety", "/earn", "/societies", "/hostels-offices", "/about", "/careers", "/contact", "/press", "/guides", "/help", "/waitlist", "/waitlist-map", "/status", "/legal/terms", "/legal/privacy", "/legal/refund-cancellation", "/legal/helper-agreement", "/legal/community-safety", "/legal/grievance-officer", "/legal/cookies"];
  const all = [...fixed, ...cats.map((c) => `/tasks/${c.s}`), ...ps.map((p) => `/packs/${p.s}`), ...posts.map((p) => `/guides/${p.s}`)];
  return all.map((p) => ({ url: SITE_URL + p, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7, alternates: { languages: { hi: `${SITE_URL}${p}?lang=hi` } } }));
}
