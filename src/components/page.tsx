import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Hero({ eyebrow, title, lead, children, dark }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; children?: ReactNode; dark?: boolean }) {
  return (
    <section className={cn("grain", dark ? "bg-tide text-cream" : "bg-cream/50")}>
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
        {eyebrow && <p className="washi">{eyebrow}</p>}
        <h1 className={cn("mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] md:text-6xl", !dark && "text-tide")}>{title}</h1>
        {lead && <p className={cn("mt-5 max-w-2xl text-lg", dark ? "text-sage" : "text-ink/70")}>{lead}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
export function Section({ children, tone = "bone", className = "" }: { children: ReactNode; tone?: "bone" | "white" | "cream" | "tide" | "forest"; className?: string }) {
  const t = { bone: "bg-bone", white: "bg-white", cream: "bg-cream", tide: "bg-tide text-cream", forest: "bg-forest text-cream" }[tone];
  return <section className={cn("py-16 md:py-20", t, className)}><div className="mx-auto max-w-6xl px-5 md:px-8">{children}</div></section>;
}
export function H2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("max-w-3xl text-3xl font-semibold md:text-4xl", className)}>{children}</h2>;
}
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) }} />
      <div className="divide-y divide-line border-y border-line">
        {items.map((f) => <details key={f.q} className="py-4"><summary className="flex items-center justify-between gap-4 text-lg font-semibold">{f.q}<span className="plus text-2xl text-euca transition-transform">+</span></summary><p className="mt-2 max-w-2xl text-ink/75">{f.a}</p></details>)}
      </div>
    </>
  );
}
export function Cta({ href = "/waitlist", children = "Join the waitlist", sun = true }: { href?: string; children?: ReactNode; sun?: boolean }) {
  return <Link href={href} className={cn("btn", sun ? "btn-sun" : "btn-primary")}>{children}</Link>;
}
