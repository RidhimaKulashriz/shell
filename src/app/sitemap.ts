import type { MetadataRoute } from "next";
import { CATEGORIES, PACKS } from "@/lib/catalog";
import { GUIDES, LEGAL } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = ["", "/how-it-works", "/services", "/services/quick", "/services/managed", "/services/routines", "/services/plus", "/tasks", "/packs", "/pricing", "/safety", "/earn", "/societies", "/offices", "/about", "/careers", "/contact", "/press", "/guides", "/help", "/waitlist", "/waitlist/map", "/status"];
  const dyn = [...CATEGORIES.map((c) => `/tasks/${c.slug}`), ...PACKS.map((p) => `/packs/${p.slug}`), ...GUIDES.map((g) => `/guides/${g.slug}`), ...LEGAL.map((l) => `/legal/${l.slug}`)];
  return [...fixed, ...dyn].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
    alternates: { languages: { en: `${SITE_URL}${p}`, hi: `${SITE_URL}${p}` } },
  }));
}
