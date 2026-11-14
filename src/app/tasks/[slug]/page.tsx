import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, Section, H2 } from "@/components/Page";
import { Icon } from "@/components/Icon";
import { FaqList } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { getCategories, getCategory, getPacks } from "@/lib/data";
import { rupees } from "@/lib/pricing";
import { SITE_URL, buildMeta } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) return {};
  return buildMeta({ title: `${c.nameEn} at home in Delhi | Shell`, description: c.content.intro, path: `/tasks/${slug}` });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [c, all, packs] = await Promise.all([getCategory(slug), getCategories(), getPacks()]);
  if (!c) notFound();
  const k = c.content;
  const related = all.filter((x) => x.slug !== slug).slice((all.findIndex((x) => x.slug === slug) + 1) % 13, ((all.findIndex((x) => x.slug === slug) + 1) % 13) + 3);
  const relatedPacks = packs.filter((p) => p.content.tasks.some((t) => t.slug === slug));
  const faqs = [
    ...k.faqs,
    { q: `How much does ${c.nameEn.toLowerCase()} cost?`, a: `Usually ${rupees(c.priceMin)} to ${rupees(c.priceMax)} for ${k.duration}. The exact price comes in your plan as a receipt line, and you see it before you pay.` },
    { q: `Who does the ${c.nameEn.toLowerCase()}?`, a: `${k.helper}. Every helper is 18 or above, with government ID and college ID checked and safety training passed.` },
    { q: "What is not included?", a: `${k.excluded.join("; ")}. If you need one of these, tell us in the message and ops will say plainly whether we can help.` },
    { q: "What if I'm not happy with the result?", a: "Tap the checklist items that missed and we send a helper back within 24 hours, free. If it still isn't right, open a dispute and we reply in 24 hours." },
  ];
  const steps = ["Aap message likhte ho", k.run[0], k.run[1], "Aap approve karte ho, tab payment helper ko jaata hai"];
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Service", name: `${c.nameEn} at home`, areaServed: { "@type": "City", name: "Delhi" }, provider: { "@type": "Organization", name: "Shell", url: SITE_URL }, description: k.intro, offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: c.priceMin / 100, highPrice: c.priceMax / 100 } }} />
      <PageHero eyebrow={c.nameHi} title={<>{c.nameEn}</>} sub={k.intro}>
        <div className="flex flex-wrap items-center gap-5">
          <Link href={`/waitlist?msg=${encodeURIComponent(c.nameEn + " karwana hai")}`} className="pill pill-sun" data-cta={`task_start_${slug}`}>Start this task</Link>
          <span className="font-mono text-sm">{rupees(c.priceMin)} to {rupees(c.priceMax)} · {k.duration}</span>
        </div>
        <Icon name={c.iconId} size={150} className="pointer-events-none absolute -right-4 top-10 hidden rotate-6 text-tide opacity-90 md:block" />
      </PageHero>

      <Section tone="paper">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl bg-cream p-6 ring-2 ring-tide">
            <h2 className="font-display text-3xl font-bold">Included</h2>
            <ul className="mt-3 space-y-2">{k.included.map((x) => <li key={x} className="flex gap-3"><Icon name="check" size={24} />{x}</li>)}</ul>
          </div>
          <div className="rounded-3xl border-2 border-dashed border-tide/50 p-6">
            <h2 className="font-display text-3xl font-bold">Not included</h2>
            <ul className="mt-3 space-y-2">{k.excluded.map((x) => <li key={x} className="flex gap-3 opacity-80"><span className="font-mono">×</span>{x}</li>)}</ul>
          </div>
        </div>
      </Section>

      <Section tone="dark">
        <H2>Kaam kaise chalta hai</H2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s} className="rounded-3xl bg-moss p-5" style={{ transform: `rotate(${[-1, 0.8, -0.6, 1][i]}deg)` }}>
              <span className="font-mono text-sm text-sun">0{i + 1}</span>
              <p className="mt-2 text-lg leading-snug">{s}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-2xl text-cream/80"><b>Helper:</b> {k.helper}. Training: ek safety module (mandatory) aur is category ka chhota quiz, pass mark 80%.</p>
      </Section>

      <Section tone="cream">
        <H2>Before and after</H2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {["Before", "After"].map((l, i) => (
            <div key={l} className="grid aspect-[4/3] place-items-center rounded-3xl border-2 border-dashed border-tide/50 bg-white/50 text-center" style={{ transform: `rotate(${i ? 1 : -1}deg)` }}>
              <div><Icon name={c.iconId} size={64} /><p className="font-mono text-xs uppercase tracking-widest">{l} photo</p><p className="hand text-xl">Pehli society ke jobs ke baad yahan real photos aayengi.</p></div>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="paper">
        <div className="grid gap-10 md:grid-cols-[0.8fr_1.6fr]">
          <h2 className="font-display text-4xl font-black leading-none md:sticky md:top-28 md:self-start">Sawaal jo log poochhte hain</h2>
          <FaqList items={faqs} />
        </div>
      </Section>

      <Section tone="cream">
        {relatedPacks.length ? (
          <div className="mb-10">
            <p className="font-mono text-xs uppercase tracking-widest">Packs jisme ye shaamil hai</p>
            <ul className="mt-3 flex flex-wrap gap-3">{relatedPacks.map((p) => <li key={p.slug}><Link className="pill pill-forest" href={`/packs/${p.slug}`}>{p.nameEn}</Link></li>)}</ul>
          </div>
        ) : null}
        <p className="font-mono text-xs uppercase tracking-widest">Ye bhi dekho</p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">{related.map((r) => <li key={r.slug}><Link href={`/tasks/${r.slug}`} className="flex items-center gap-3 rounded-2xl bg-white/60 p-4 hover:bg-white"><Icon name={r.iconId} size={40} /><span className="font-semibold">{r.nameEn}</span></Link></li>)}</ul>
        <div className="mt-12 rounded-[28px] bg-moss p-6 text-cream md:p-8">
          <p className="font-display text-3xl font-bold">Aapki society mein kab aayega?</p>
          <p className="mt-1 text-cream/80">Waitlist mein judo, jaise hi aapke tower ke liye helpers ready honge, WhatsApp par bata denge.</p>
          <Link href="/waitlist" className="pill pill-sun mt-4" data-cta="task_notify">Mujhe batao jab aap yahan aao</Link>
        </div>
      </Section>
    </>
  );
}
