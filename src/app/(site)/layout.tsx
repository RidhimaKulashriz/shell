import Link from "next/link";
import type { ReactNode } from "react";
import { jsonLd, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main id="main" className="min-h-screen pb-16 md:pb-0">
        {children}
      </main>
      <footer className="border-t border-[#E3E8E4] bg-white text-[#4B5A55]">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
          <div>
            <div className="flex items-center gap-2 text-xl font-bold text-[#0B2B26]">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#0B2B26] text-sm font-bold text-[#F2C318]">
                S
              </span>
              <span>Shell</span>
            </div>
            <p className="mt-3 text-sm text-[#4B5A55]">
              Get comfortable. We&apos;ve got it.
            </p>
            <p className="mt-2 text-xs text-[#7C8A85]">
              Launching in Dwarka, New Delhi · INR (Rs)
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0E1A17]">
              Services
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/services" className="hover:text-[#0B2B26]">
                  All Services
                </Link>
              </li>
              <li>
                <Link href="/packs" className="hover:text-[#0B2B26]">
                  Service Packs
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#0B2B26]">
                  Pricing Explainer
                </Link>
              </li>
              <li>
                <Link href="/earn" className="hover:text-[#0B2B26]">
                  Become a Helper
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0E1A17]">
              Support
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/help" className="hover:text-[#0B2B26]">
                  Help Centre
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-[#0B2B26]">
                  Safety &amp; Trust
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#0B2B26]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#0B2B26]">
                  About Shell
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0E1A17]">
              Legal (Draft)
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/legal/terms" className="hover:text-[#0B2B26]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-[#0B2B26]">
                  Privacy Policy (DPDP)
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/refund-cancellation"
                  className="hover:text-[#0B2B26]"
                >
                  Refund &amp; Cancellation
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/community-safety"
                  className="hover:text-[#0B2B26]"
                >
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#E3E8E4] px-4 py-4 text-center text-xs text-[#7C8A85]">
          © {new Date().getFullYear()} Shell · Dwarka, New Delhi · Legal pages
          are Draft - requires legal review.
        </div>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Shell",
              url: SITE_URL,
              slogan: "Get comfortable. We've got it.",
              areaServed: "Dwarka, New Delhi",
              logo: `${SITE_URL}/icon.svg`,
            },
            {
              "@type": "WebSite",
              name: "Shell",
              url: SITE_URL,
              inLanguage: ["en"],
            },
          ],
        })}
      />
    </>
  );
}
