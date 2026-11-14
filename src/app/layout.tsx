import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import "./globals.css";
import { LangProvider, type Lang } from "@/lib/i18n";
import { Announcement, Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Analytics, CookieConsent, InkFilter, Konami, WhatsAppButton } from "@/components/Floaters";
import { JsonLd } from "@/components/JsonLd";
import { CONTACT, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Shell | Get comfortable. We've got it.", template: "%s | Shell" },
  description:
    "Shell is a managed life-assistant for Indian apartment societies. One message, one plan, verified helpers, one result. Starting in Delhi.",
  applicationName: "Shell",
  manifest: "/manifest.webmanifest",
  openGraph: { siteName: "Shell", type: "website", images: [`${SITE_URL}/api/og?title=${encodeURIComponent("Get comfortable. We've got it.")}`] },
  alternates: { canonical: SITE_URL, languages: { en: SITE_URL, hi: SITE_URL } },
};

export const viewport: Viewport = { themeColor: "#0B2B26", width: "device-width", initialScale: 1 };

const FONTS =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..900,0..100,0..1;1,9..144,300..900,0..100,0..1&family=Instrument+Serif:ital@1&family=DM+Sans:opsz,wght@9..40,400..700&family=DM+Mono:wght@400;500&family=Caveat:wght@500;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const lang: Lang = jar.get("shell_lang")?.value === "hi" ? "hi" : "en";
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
        <JsonLd
          data={[
            { "@context": "https://schema.org", "@type": "Organization", name: "Shell", url: SITE_URL, slogan: "Get comfortable. We've got it.", email: CONTACT.email, areaServed: "Delhi, India" },
            { "@context": "https://schema.org", "@type": "WebSite", name: "Shell", url: SITE_URL, inLanguage: ["en", "hi"] },
          ]}
        />
      </head>
      <body>
        <LangProvider initial={lang}>
          <InkFilter />
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-sun focus:px-4 focus:py-2">Skip to content</a>
          <Announcement />
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <WhatsAppButton />
          <CookieConsent />
          <Analytics />
          <Konami />
        </LangProvider>
      </body>
    </html>
  );
}
