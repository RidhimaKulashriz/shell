import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://shell-frontend-steel.vercel.app";

/** Unique title + description, canonical, and receipt-style OG image per page. */
export function meta(o: { title: string; description: string; path: string }): Metadata {
  const og = `/api/og?title=${encodeURIComponent(o.title)}&sub=${encodeURIComponent(o.description.slice(0, 90))}`;
  return {
    title: o.title,
    description: o.description,
    alternates: { canonical: o.path, languages: { en: o.path, "x-default": o.path } },
    openGraph: { title: o.title, description: o.description, url: o.path, siteName: "Shell", type: "website", images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: o.title, description: o.description, images: [og] },
  };
}

export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
