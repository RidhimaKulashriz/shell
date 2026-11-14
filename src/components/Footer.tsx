import Link from "next/link";
import { Wordmark } from "./Header";
import { T } from "@/lib/i18n";
import { CONTACT } from "@/lib/site";

const col = "space-y-2 text-[0.95rem]";

export function Footer() {
  return (
    <footer className="band-tide relative mt-0 px-5 pb-8 pt-16 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.9fr_1fr_0.8fr_1.2fr]">
        <div>
          <Wordmark tone="light" />
          <p className="font-display mt-4 max-w-xs text-3xl font-semibold leading-tight"><T k="footer.tag" /></p>
          <p className="hand mt-3 -rotate-2 text-2xl text-sand"><T k="footer.sign" /></p>
          <Link href="/status" className="mt-5 inline-flex items-center gap-2 rounded-full border border-sage/50 px-3 py-1.5 font-mono text-xs text-sage hover:bg-moss">
            <span className="h-2 w-2 rounded-full bg-sage" aria-hidden="true" /> <T k="footer.status" />
          </Link>
        </div>
        <nav aria-label="Product" className={col}>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-sage">Product</h2>
          <FLink href="/how-it-works">How it works</FLink>
          <FLink href="/services">Services</FLink>
          <FLink href="/tasks">All tasks</FLink>
          <FLink href="/packs">Packs</FLink>
          <FLink href="/pricing">Pricing</FLink>
          <FLink href="/safety">Safety and trust</FLink>
          <FLink href="/earn">Shell Earn</FLink>
        </nav>
        <nav aria-label="Company" className={col}>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-sage">Company</h2>
          <FLink href="/about">About</FLink>
          <FLink href="/societies">For societies</FLink>
          <FLink href="/offices">Hostels and offices</FLink>
          <FLink href="/careers">Careers</FLink>
          <FLink href="/guides">Guides</FLink>
          <FLink href="/help">Help centre</FLink>
          <FLink href="/press">Press kit</FLink>
          <FLink href="/contact">Contact</FLink>
        </nav>
        <nav aria-label="Legal" className={col}>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-sage">Legal</h2>
          <FLink href="/legal/terms">Terms</FLink>
          <FLink href="/legal/privacy">Privacy policy (DPDP)</FLink>
          <FLink href="/legal/refunds">Refund and cancellation</FLink>
          <FLink href="/legal/helper-agreement">Helper agreement</FLink>
          <FLink href="/legal/community-safety">Community and safety</FLink>
          <FLink href="/legal/grievance">Grievance officer</FLink>
          <FLink href="/legal/cookies">Cookie policy</FLink>
          <p className="pt-3 font-mono text-xs text-sage">
            <a className="hover:text-cream" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <br />WhatsApp {CONTACT.whatsappDisplay}
          </p>
        </nav>
      </div>
      <hr className="perf mx-auto my-8 max-w-7xl text-sage" />
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 font-mono text-xs text-sage">
        <span>© 2026 Shell. Kuch bhi galat lage to SOS dabao. Hum 20 second mein jaag jaate hain.</span>
        <span className="flex gap-4">
          <a href="https://instagram.com/" rel="noopener" className="hover:text-cream">Instagram</a>
          <a href="https://linkedin.com/" rel="noopener" className="hover:text-cream">LinkedIn</a>
          <a href="https://x.com/" rel="noopener" className="hover:text-cream">X</a>
        </span>
      </div>
    </footer>
  );
}

function FLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div>
      <Link href={href} className="text-cream/90 hover:text-sun hover:underline hover:decoration-wavy hover:underline-offset-4">{children}</Link>
    </div>
  );
}
