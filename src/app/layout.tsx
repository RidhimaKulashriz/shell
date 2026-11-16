import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ensureSeed } from "@/lib/boot";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Shell | Get comfortable. We've got it.",
    template: "%s | Shell",
  },
  description:
    "Book trusted, verified helpers for everyday home services, errands, and groceries in Dwarka, Delhi. Pay only when the job is done.",
  applicationName: "Shell",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0B2B26",
  width: "device-width",
  initialScale: 1,
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  await ensureSeed();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="bg-[var(--color-page-bg)] text-[var(--color-text-primary)]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-[10px] focus:bg-[#F2C318] focus:px-4 focus:py-2 focus:font-semibold focus:text-[#0E1A17]"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
