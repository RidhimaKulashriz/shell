import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SvgDefs } from "@/components/Icon";
import { getLang } from "@/lib/lang";
import { ensureSeed } from "@/lib/boot";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Shell | Get comfortable. We've got it.", template: "%s | Shell" },
  description: "Shell is a managed life-assistant for Indian apartment societies. Write one message in Hindi, English or Hinglish. We plan it, send verified helpers and stay till it is done.",
  applicationName: "Shell",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#0B2B26", width: "device-width", initialScale: 1 };

const FONTS =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,0..100,0..1&family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400..800&family=DM+Mono:wght@400;500&family=Caveat:wght@500..700&family=Noto+Sans+Devanagari:wght@400..700&display=swap";

export default async function RootLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  const lang = await getLang();
  return (
    <html lang={lang === "hi" ? "hi" : "en"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>
        <SvgDefs />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-sun focus:px-4 focus:py-2 focus:font-bold">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
