import Link from "next/link";
import type { ReactNode } from "react";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUser, homeFor } from "@/lib/auth";
import { Header, Announcement, WhatsAppFab, CookieBanner } from "@/components/SiteChrome";
import { Logo } from "@/components/icons";

export const dynamic = "force-dynamic";
const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919810000000";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [ann] = await db.select().from(announcements).where(eq(announcements.active, true)).orderBy(desc(announcements.createdAt)).limit(1).catch(() => []);
  const user = await getUser().catch(() => null);
  return (
    <>
      {ann && <Announcement text={ann.text} />}
      <Header appHref={user ? homeFor(user.role) : "/login"} appLabel={user ? "Open app" : "Sign in"} />
      <main>{children}</main>
      <Footer />
      <WhatsAppFab number={WA} />
      <CookieBanner />
    </>
  );
}

function Col({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-sage" style={{ fontFamily: "var(--font-sans)" }}>{title}</h3>
      <ul className="space-y-2 text-sm">{links.map(([h, l]) => <li key={h}><Link href={h} className="text-cream/80 hover:text-white">{l}</Link></li>)}</ul>
    </div>
  );
}

function Footer() {
  return (
    <footer className="grain bg-tide text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:px-8 lg:grid-cols-[1.8fr_1fr_0.9fr_1.1fr]">
        <div>
          <Logo light size={34} />
          <p className="serif mt-4 text-2xl leading-snug">Get comfortable. We&apos;ve got it.</p>
          <p className="mt-2 max-w-sm text-sm text-cream/70">We don&apos;t help you find people. We take responsibility for getting it done.</p>
          <p className="mt-5 text-[1.5rem] text-sand" style={{ fontFamily: "var(--font-hand)" }}>Made in Delhi, with chai.</p>
          <div className="mt-5 space-y-1 text-sm text-cream/80">
            <p>hello@shell.example</p><p>WhatsApp +91 98100 00000</p>
          </div>
          <Link href="/status" className="mt-5 inline-flex items-center gap-2 rounded-full border border-moss px-3 py-1.5 text-xs"><span className="h-2 w-2 rounded-full bg-[#4ade80]" />Status: all good</Link>
        </div>
        <div className="grid grid-cols-2 gap-8 lg:contents">
          <Col title="Product" links={[["/how-it-works", "How it works"], ["/services", "Services"], ["/packs", "Packs"], ["/pricing", "Pricing"], ["/safety", "Safety and trust"], ["/earn", "Earn with Shell"]]} />
          <Col title="Company" links={[["/about", "About"], ["/careers", "Careers"], ["/contact", "Contact"], ["/press", "Press kit"], ["/guides", "Guides"], ["/help", "Help centre"], ["/societies", "For societies"], ["/business", "Hostels and offices"]]} />
        </div>
        <Col title="Legal" links={[["/legal/terms", "Terms"], ["/legal/privacy", "Privacy policy"], ["/legal/refunds", "Refund and cancellation"], ["/legal/helper-agreement", "Helper agreement"], ["/legal/community-safety", "Community and safety"], ["/legal/grievance", "Grievance officer"], ["/legal/cookies", "Cookie policy"]]} />
      </div>
      <div className="border-t border-moss py-5 text-center text-xs text-cream/50">© {new Date().getFullYear()} Shell. Massage, makeup and personal care are not offered. Helpers are always 18 or older.</div>
    </footer>
  );
}
