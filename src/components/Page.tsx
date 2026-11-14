import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, sub, tone = "cream", children }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; tone?: "cream" | "dark" | "paper"; children?: ReactNode }) {
  const cls = tone === "dark" ? "band-dark" : tone === "paper" ? "band-paper" : "band-cream";
  return (
    <section className={`${cls} relative overflow-hidden px-5 pb-14 pt-10 md:px-10 md:pb-20 md:pt-16`}>
      <div className="mx-auto max-w-6xl">
        {eyebrow ? <p className="hand -rotate-1 text-3xl text-euca md:text-4xl" style={tone === "dark" ? { color: "#E8C48A" } : undefined}>{eyebrow}</p> : null}
        <h1 className="font-display mt-2 max-w-4xl text-[2.9rem] font-black leading-[0.95] tracking-tight sm:text-6xl md:text-[5rem]">{title}</h1>
        {sub ? <p className="mt-5 max-w-2xl text-lg leading-snug opacity-85 md:text-xl">{sub}</p> : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

export function Section({ tone = "cream", children, id, className = "" }: { tone?: "cream" | "dark" | "paper" | "tide"; children: ReactNode; id?: string; className?: string }) {
  const cls = tone === "dark" ? "band-dark" : tone === "tide" ? "band-tide" : tone === "paper" ? "band-paper" : "band-cream";
  return (
    <section id={id} className={`${cls} px-5 py-16 md:px-10 md:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function H2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-display text-4xl font-black leading-[0.98] md:text-6xl ${className}`}>{children}</h2>;
}
