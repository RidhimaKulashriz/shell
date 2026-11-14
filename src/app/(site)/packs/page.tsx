import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHero, Section } from "@/components/site/Bits";
import { meta } from "@/lib/seo";
import { packCards } from "@/lib/site-data";
import { getLang } from "@/lib/lang";
import { inr, minutesToText } from "@/lib/format";

export const metadata = meta({ title: "Packs: ready-made plans", description: "Guests Are Coming, Move-In Ready, Diwali Ready, Exam Week Support, Weekend Reset, New Flat Setup and Party Prep. Each with a sample receipt.", path: "/packs" });

export default async function Page() {
  const [packs, lang] = [await packCards(), await getLang()];
  return (
    <>
      <PageHero eyebrow="ready-made plans" title="Seven packs," em="one for every occasion." sub="Pick a pack, add or remove tasks, and see the receipt change live." />
      <Section tone="paper">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {packs.map((p, i) => (
            <Link key={p.slug} href={`/packs/${p.slug}`} className="ticket border border-ink/20 bg-cream p-6 transition-transform hover:-translate-y-1" style={{ transform: `rotate(${[-1.2, 0.8, -0.5, 1.1, -0.8, 0.5, -1][i % 7]}deg)` }}>
              <Icon name={p.icon} size={50} /><h2 className="display mt-3 text-3xl">{lang === "hi" ? p.nameHi : p.name}</h2><p className="mt-2 text-sm">{lang === "hi" ? p.copyHi : p.copy}</p>
              <div className="mt-4 border-t border-dashed border-ink/30 pt-3 text-sm"><div className="mono">{p.tasks.length} tasks · about {minutesToText(p.minutes)}</div><div className="mono mt-1 text-lg">from {inr(p.from)}</div></div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
