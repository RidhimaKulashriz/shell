import Link from "next/link";
import { PageHero, Section } from "@/components/Page";
import { GUIDES } from "@/lib/content";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Shell guides: practical help for home and helpers", description: "Plain guides on prepping your home for guests, checking helpers, and student work that fits a timetable.", path: "/guides" });

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Guides" title={<>Kaam ki <span className="font-accent text-euca">baatein</span>.</>} sub="Ghar, guests aur helpers ke baare mein seedhi guides." />
      <Section tone="paper">
        <ul className="grid gap-6 md:grid-cols-3">
          {GUIDES.map((g, i) => (
            <li key={g.slug} style={{ transform: `rotate(${[-1, 0.8, -0.5][i]}deg)` }}>
              <Link href={`/guides/${g.slug}`} className="block h-full rounded-3xl bg-cream p-6 ring-2 ring-tide hover:-translate-y-1">
                <p className="font-mono text-xs">{g.date} · {Math.max(2, Math.round(g.sections.reduce((a, s) => a + s.p.join(" ").split(" ").length, 0) / 200))} min read</p>
                <h2 className="font-display mt-2 text-3xl font-black leading-tight">{g.title}</h2>
                <p className="mt-2 text-sm">{g.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
