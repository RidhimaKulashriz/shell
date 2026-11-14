import type { Faq } from "@/lib/catalog";
import { JsonLd } from "./JsonLd";

export function FaqList({ items, tone = "light", schema = true }: { items: Faq[]; tone?: "light" | "dark"; schema?: boolean }) {
  return (
    <div>
      {schema ? (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      ) : null}
      <div className="divide-y-2 divide-dashed divide-current/25 border-y-2 border-dashed border-current/25">
        {items.map((f) => (
          <details key={f.q} className="group py-1">
            <summary className="font-display flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-xl font-bold leading-snug marker:hidden md:text-2xl [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="shrink-0 transition-transform duration-300 group-open:rotate-45" aria-hidden="true">
                <path d="M15 5 C14 12 16 18 15 25" /><path d="M5 15 C12 14 18 16 25 15" />
              </svg>
            </summary>
            <p className={`max-w-3xl pb-5 text-[1.02rem] leading-relaxed ${tone === "dark" ? "text-cream/85" : "text-ink/80"}`}>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
