import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E3E8E4] bg-white text-[#4B5A55]">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <div className="flex items-center gap-2 text-xl font-bold text-[#0B2B26]">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#0B2B26] text-sm font-bold text-[#F2C318]">
              S
            </span>
            <span>Shell</span>
          </div>
          <p className="mt-3 text-sm text-[#4B5A55]">Get comfortable. We&apos;ve got it.</p>
          <p className="mt-2 text-xs text-[#7C8A85]">Launching in Dwarka Sectors 6, 10, 12 · New Delhi · INR (Rs)</p>
          <p className="mt-3 text-xs font-medium text-[#7C8A85]">Scheduled slots · 8am – 8pm · 7 days</p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0E1A17]">Services</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/services" className="hover:text-[#0B2B26] hover:underline">
                All Services
              </Link>
            </li>
            <li>
              <Link href="/packs" className="hover:text-[#0B2B26] hover:underline">
                Service Packs
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-[#0B2B26] hover:underline">
                Pricing Explainer
              </Link>
            </li>
            <li>
              <Link href="/earn" className="hover:text-[#0B2B26] hover:underline">
                Become a Helper
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0E1A17]">Support</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/help" className="hover:text-[#0B2B26] hover:underline">
                Help Centre
              </Link>
            </li>
            <li>
              <Link href="/safety" className="hover:text-[#0B2B26] hover:underline">
                Safety &amp; Trust
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[#0B2B26] hover:underline">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-[#0B2B26] hover:underline">
                About Shell
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0E1A17]">Legal (Draft)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/legal/terms" className="hover:text-[#0B2B26] hover:underline">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/legal/privacy" className="hover:text-[#0B2B26] hover:underline">
                Privacy Policy (DPDP)
              </Link>
            </li>
            <li>
              <Link href="/legal/refund-cancellation" className="hover:text-[#0B2B26] hover:underline">
                Refund &amp; Cancellation
              </Link>
            </li>
            <li>
              <Link href="/legal/community-safety" className="hover:text-[#0B2B26] hover:underline">
                Community Guidelines
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#E3E8E4] px-4 py-4 text-center text-xs text-[#7C8A85]">
        © {new Date().getFullYear()} Shell · Dwarka, New Delhi · Legal pages are Draft - requires legal review.
      </div>
    </footer>
  );
}
