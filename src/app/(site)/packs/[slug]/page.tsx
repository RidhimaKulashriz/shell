import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { packs, taskTemplates } from "@/db/schema";
import { Faq, PageHero, Section } from "@/components/site/Bits";
import { PackCustomise } from "@/components/PackCustomise";
import { catalogForClient } from "@/lib/site-data";
import { activePricing } from "@/lib/data";
import { jsonLd, meta } from "@/lib/seo";
import { getLang } from "@/lib/lang";

async function load(slug: string) {
  const [p] = await db.select().from(packs).where(eq(packs.slug, slug)).limit(1);
  return p;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  return p ? meta({ title: `${p.nameEn} pack`, description: p.copyEn.slice(0, 155), path: `/packs/${p.slug}` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  if (!p) notFound();
  const lang = await getLang();
  const [catalog, config] = [await catalogForClient(), await activePricing()];
  void taskTemplates;
  const sorted = [...p.items].sort((a, b) => a.offsetHours - b.offsetHours);
  return (
    <>
      <PageHero eyebrow={lang === "hi" ? p.nameHi : "Shell pack"} title={p.nameEn} sub={lang === "hi" ? p.copyHi : p.copyEn} />
      <Section tone="paper">
        <PackCustomise slug={p.slug} name={p.nameEn} items={p.items} catalog={catalog} config={config} />
      </Section>
      <Section tone="dark">
        <h2 className="display text-4xl md:text-5xl">How the pack runs</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-4">
          {sorted.map((it, i) => (
            <li key={it.label} className="relative rounded-2xl border border-sage/60 p-4" style={{ transform: `rotate(${[-1, 0.8, -0.5, 1][i % 4]}deg)` }}>
              <span className="mono text-sm text-sand">{it.offsetHours === 0 ? "T (the day)" : `T ${it.offsetHours < 0 ? "minus" : "plus"} ${Math.abs(it.offsetHours)} hours`}</span>
              <p className="display mt-1 text-2xl">{it.label}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8">Helper types involved: {p.helperTypes.join(", ")}.</p>
      </Section>
      <Section tone="cream"><h2 className="display mb-6 text-4xl">FAQs</h2><Faq items={p.faqs} /></Section>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({ "@context": "https://schema.org", "@type": "Service", name: p.nameEn, description: p.copyEn, areaServed: "Delhi" })} />
    </>
  );
}
