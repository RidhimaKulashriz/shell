import type { ReactNode } from "react";
import { jsonLd, SITE_URL } from "@/lib/seo";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";

export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-screen pb-16 md:pb-0">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppFab lead="Hi Shell, I need help in Dwarka" />
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
