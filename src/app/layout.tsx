import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, DM_Sans, DM_Mono, Caveat } from "next/font/google";
import "./globals.css";
import { Extras } from "@/components/Extras";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["SOFT", "WONK", "opsz"], display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], variable: "--font-dm-mono", weight: ["400", "500"], display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Shell. Get comfortable. We've got it.", template: "%s | Shell" },
  description: "Shell is a managed personal assistant for your apartment society. Tell us what you need, and we plan it, send verified helpers, and see it through.",
  manifest: "/manifest.webmanifest",
  openGraph: { siteName: "Shell", type: "website", locale: "en_IN" },
  alternates: { canonical: "./" },
};
export const viewport: Viewport = { themeColor: "#051f20", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable} ${dmMono.variable} ${caveat.variable}`}>
      <body>{children}<Extras /></body>
    </html>
  );
}
