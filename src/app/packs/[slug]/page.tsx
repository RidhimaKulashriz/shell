import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, Section, H2 } from "@/components/Page";
import { FaqList } from "@/components/Faq";
import { PackCustomise } from "@/components/PackCustomise";
import { JsonLd } from "@/components/JsonLd";
import { Receipt, Reveal, Stamp } from "@/components/ui";
import { getCategories, getPack } from "@/lib/data";
import { estimate, rupees } from "@/lib/pricing";
import { buildMeta } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPack(slug);
  if (!p) return {};
  return buildMeta({ title: `${p.nameEn}: a Shell pack for Delhi homes`, description: p.content.tagline, path: `/packs/${slug}` });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, cats] = await Promise.all([getPack(slug), getCategories()]);
  if (!p) notFound();
  const k = p.content;
  const rates = Object.fromEntries(cats.map((c) => [c.slug, c.baseRate / 100]));
  const est = estimate({ managed: true, tasks: k.tasks.map((t) => ({ baseRate: (rates[t.slug] ?? 150) * 100, quantity: t.hours })) });
  const hours = k.tasks.reduce((a, t) => a + t.hours, 0);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Product", name: p.nameEn, description: k.tagline, offers: { "@type": "Offer", priceCurrency: "INR", price: p.startingPrice / 100, availability: "https://schema.org/PreOrder" } }} />
      <PageHero eyebrow={p.nameHi} title={p.nameEn} sub={k.tagline} tone="dark">
        <div className="flex flex-wrap items-center gap-5">
          <Link href={`/waitlist?msg=${encodeURIComponent(p.nameEn + " pack")}`} className="pill pill-sun" data-cta={`pack_${slug}`}>Order this pack</Link>
          <span className="font-mono text-sm">from {rupees(p.startingPrice)} · {hours} hrs of help</span>
        </div>
      </PageHero>

      <section className="band-paper px-0 py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal rot={-1}>
            <Receipt
              title={k.tagline ? p.nameEn.toUpperCase() : "PACK"}
              lines={[
                ...k.tasks.map((t, i) => ({ label: t.label, sub: `${t.offset} · ${t.hours} hr`, amount: rupees((rates[t.slug] ?? 150) * 100 * t.hours), stamped: true, delay: i * 150 })),
                { label: "Platform fee", amount: rupees(est.platformFee) },
                { label: "Coordination fee", amount: rupees(est.coordinationFee) },
              ]}
              totalLabel="TOTAL (est.)"
              total={`${rupees(est.low)} - ${rupees(est.high)}`}
              foot="Sample receipt. Includes Shell Guarantee. Exact price after human check."
              stamp={<Stamp tone="green">SAMPLE</Stamp>}
            />
          </Reveal>
        </div>
      </section>

      <Section tone="cream">
        <H2>Kaise chalta hai</H2>
        <ol className="relative mt-10 max-w-2xl border-l-4 border-dotted border-tide/40 pl-8">
          {k.timeline.map((t) => (
            <li key={t.at} className="relative mb-6"><span className="absolute -left-[2.55rem] top-1 h-4 w-4 rounded-full bg-sun ring-4 ring-cream" aria-hidden="true" /><p className="font-mono text-xs uppercase tracking-widest text-euca">{t.at}</p><p className="text-xl">{t.what}</p></li>
          ))}
        </ol>
      </Section>

      <Section tone="paper"><PackCustomise title={p.nameEn} tasks={k.tasks} rates={rates} /></Section>

      <Section tone="dark">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <H2>Kaun aayega</H2>
            <ul className="mt-5 flex flex-wrap gap-2">{k.helpers.map((h) => <li key={h} className="rounded-full border-2 border-sage px-4 py-1.5">{h}</li>)}</ul>
            <p className="mt-4 text-cream/80">Sab verified. Aap pehle Meet Your Helper card dekhte ho.</p>
          </div>
          <FaqList items={k.faqs} tone="dark" />
        </div>
      </Section>
    </>
  );
}
