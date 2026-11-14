import Link from "next/link";
import type { ReactNode } from "react";
import { HandUnderline } from "@/components/ui";
import { jsonLd } from "@/lib/seo";

export function PageHero({ eyebrow, title, em, sub, children, tone = "cream" }: { eyebrow?: string; title: string; em?: string; sub?: string; children?: ReactNode; tone?: "cream" | "dark" }) {
  return (
    <section className={`relative overflow-hidden px-5 pb-14 pt-14 md:px-8 md:pb-20 md:pt-20 ${tone === "dark" ? "dark-band" : "bg-cream"}`}>
      <div className="mx-auto max-w-6xl">
        {eyebrow && <span className="hand inline-block -rotate-2 text-3xl text-euc">{eyebrow}</span>}
        <h1 className="display mt-2 max-w-4xl text-[clamp(2.4rem,7vw,5.2rem)]">
          {title}
          {em && <> <span className="serif-i relative inline-block">{em}<HandUnderline /></span></>}
        </h1>
        {sub && <p className="mt-6 max-w-2xl text-lg md:text-xl">{sub}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function Section({ children, tone = "cream", className = "", id }: { children: ReactNode; tone?: "cream" | "paper" | "dark" | "tide"; className?: string; id?: string }) {
  const bg = tone === "dark" ? "dark-band" : tone === "tide" ? "tide-band" : tone === "paper" ? "paper" : "bg-cream";
  return (
    <section id={id} className={`${bg} px-5 py-16 md:px-8 md:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function Faq({ items, schema = true }: { items: { q: string; a: string }[]; schema?: boolean }) {
  return (
    <div>
      <div className="divide-y-2 divide-dashed divide-ink/25 rounded-xl border border-ink/20 bg-paper px-5">
        {items.map((f, i) => (
          <details key={f.q} className="group py-4" open={i === 0 && items.length < 4}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold md:text-lg">
              <span>{f.q}</span>
              <svg width="26" height="26" viewBox="0 0 26 26" className="shrink-0 transition-transform duration-300 group-open:rotate-45" aria-hidden><path d="M13 3 V23 M3 13 H23" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" /></svg>
            </summary>
            <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) })} />}
    </div>
  );
}

export function LinkArrow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 font-bold">
      <span className="link-quiet">{children}</span>
      <svg width="22" height="14" viewBox="0 0 22 14" className="transition-transform group-hover:translate-x-1" aria-hidden><path d="M1 7 H20 M14 1 L20 7 L14 13" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </Link>
  );
}
