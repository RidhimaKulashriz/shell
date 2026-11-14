import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const CONTACT = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@shell.in",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999",
  whatsappDisplay: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? "+91 99999 99999",
  safetyLine: process.env.NEXT_PUBLIC_SAFETY_LINE ?? "+91 99999 99998",
};

export function buildMeta(o: { title: string; description: string; path: string; ogSub?: string }): Metadata {
  const url = `${SITE_URL}${o.path}`;
  const og = `${SITE_URL}/api/og?title=${encodeURIComponent(o.title)}&sub=${encodeURIComponent(o.ogSub ?? o.description.slice(0, 100))}`;
  return {
    title: o.title.includes("Shell") ? { absolute: o.title } : o.title,
    description: o.description,
    alternates: { canonical: url, languages: { en: url, hi: url, "x-default": url } },
    openGraph: { title: o.title, description: o.description, url, siteName: "Shell", type: "website", images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: o.title, description: o.description, images: [og] },
  };
}
