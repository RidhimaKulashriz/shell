import Link from "next/link";
import type { ReactNode } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { Wordmark } from "@/components/Icon";
import { AnnouncementBar, CookieConsent, Header, SiteEffects, WhatsAppFab } from "@/components/site/Chrome";
import { getLang } from "@/lib/lang";
import { dict } from "@/lib/i18n";
import { jsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  const t = dict(lang);
  const [ann] = await db.select().from(announcements).where(eq(announcements.scope, "site")).orderBy(desc(announcements.createdAt)).limit(1);
  const annText = ann?.active ? (lang === "hi" && ann.textHi ? ann.textHi : ann.text) : "";
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999900000";
  const col = (title: string, links: [string, string][]) => (
    <div>
      <h2 className="mono mb-3 text-xs uppercase tracking-[0.2em] text-sage">{title}</h2>
      <ul className="space-y-2">
        {links.map(([h, l]) => (
          <li key={h}><Link href={h} className="hover:underline">{l}</Link></li>
        ))}
      </ul>
    </div>
  );
  return (
    <>
      <AnnouncementBar text={annText} />
      <Header lang={lang} t={t} />
      <main id="main">{children}</main>
      <footer className="tide-band mt-0 border-t-2 border-ink">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:px-8 lg:grid-cols-[2.4fr_1fr_1fr_1.5fr]">
          <div>
            <Wordmark size={36} className="text-cream" />
            <p className="display mt-4 max-w-xs text-2xl">{t["foot.tag"]}</p>
            <p className="hand mt-6 -rotate-2 text-3xl text-sand">{t["foot.sign"]}</p>
            <div className="mt-6 space-y-1 text-sm text-cream/80">
              <p>hello@shell.example</p>
              <p>WhatsApp +{wa}</p>
              <p><Link className="underline" href="/legal/grievance-officer">Grievance officer</Link></p>
            </div>
            <Link href="/status" className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-sage px-3 py-1 text-sm"><span className="h-2.5 w-2.5 rounded-full bg-sage" />{t["foot.status"]}</Link>
          </div>
          {col(t["foot.product"], [["/how-it-works", "How it works"], ["/services", "Services"], ["/packs", "Packs"], ["/pricing", "Pricing and estimator"], ["/safety", "Safety and trust"], ["/earn", "Shell Earn"], ["/waitlist-map", "Live waitlist map"]])}
          {col(t["foot.company"], [["/about", "About"], ["/careers", "Careers"], ["/contact", "Contact"], ["/press", "Press kit"], ["/guides", "Guides"], ["/help", "Help centre"], ["/societies", "For societies"], ["/hostels-offices", "Hostels and offices"]])}
          <div>
            <h2 className="mono mb-3 text-xs uppercase tracking-[0.2em] text-sage">{t["foot.legal"]}</h2>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {[["terms", "Terms"], ["privacy", "Privacy (DPDP)"], ["refund-cancellation", "Refund and cancellation"], ["helper-agreement", "Helper agreement"], ["community-safety", "Community and safety"], ["grievance-officer", "Grievance officer"], ["cookies", "Cookie policy"]].map(([h, l]) => (
                <li key={h}><Link href={`/legal/${h}`} className="hover:underline">{l}</Link></li>
              ))}
            </ul>
            <div className="mt-5 flex gap-4 text-sm text-cream/80"><Link href="/contact">Instagram</Link><Link href="/contact">LinkedIn</Link><Link href="/contact">X</Link></div>
          </div>
        </div>
        <div className="border-t border-cream/15 px-5 py-4 text-center text-xs text-cream/60">© {new Date().getFullYear()} Shell. Delhi. Legal pages are drafts and need a lawyer's review.</div>
      </footer>
      <WhatsAppFab lead={t["wa.msg"]} />
      <CookieConsent t={t} />
      <SiteEffects />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({ "@context": "https://schema.org", "@graph": [{ "@type": "Organization", name: "Shell", url: SITE_URL, slogan: "Get comfortable. We've got it.", areaServed: "Delhi", logo: `${SITE_URL}/icon.svg` }, { "@type": "WebSite", name: "Shell", url: SITE_URL, inLanguage: ["en", "hi"] }] })} />
    </>
  );
}
