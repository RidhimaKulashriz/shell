import type { MetadataRoute } from "next";
import { CATALOG, PACKS } from "@/lib/catalog";
import { GUIDES, LEGAL } from "@/lib/content";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const paths = ["", "/how-it-works", "/services", "/services/quick", "/services/managed", "/services/routines", "/services/plus", "/packs", "/pricing", "/safety", "/earn", "/societies", "/business", "/about", "/careers", "/contact", "/press", "/guides", "/help", "/waitlist",
    ...CATALOG.map((c) => `/tasks/${c.slug}`), ...PACKS.map((p) => `/packs/${p.slug}`), ...GUIDES.map((g) => `/guides/${g.slug}`), ...Object.keys(LEGAL).map((l) => `/legal/${l}`)];
  return paths.map((p) => ({ url: base + p, lastModified: new Date() }));
}
