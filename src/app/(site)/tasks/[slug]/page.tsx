import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { packs, taskCategories, taskTemplates } from "@/db/schema";
import { Icon } from "@/components/Icon";
import { Faq, PageHero, Section } from "@/components/site/Bits";
import { EnquiryForm } from "@/components/EnquiryForm";
import { TimeMachine } from "@/components/TimeMachine";
import { Pill } from "@/components/ui";
import { jsonLd, meta, SITE_URL } from "@/lib/seo";
import { getLang } from "@/lib/lang";
import { inr, minutesToText } from "@/lib/format";
import { roomSvg } from "@/lib/placeholders";

async function load(slug: string) {
  const [c] = await db.select().from(taskCategories).where(eq(taskCategories.slug, slug)).limit(1);
  return c;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = await load((await params).slug);
  return c ? meta({ title: `${c.nameEn} at home in Delhi`, description: c.introEn.slice(0, 155), path: `/tasks/${c.slug}` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await load(slug);
  if (!c) notFound();
  const lang = await getLang();
  const [tpls, allPacks, others] = await Promise.all([db.select().from(taskTemplates).where(eq(taskTemplates.categorySlug, slug)).orderBy(asc(taskTemplates.displayOrder)), db.select().from(packs), db.select().from(taskCategories).where(ne(taskCategories.slug, slug)).orderBy(asc(taskCategories.displayOrder))]);
  const tplSlugs = new Set(tpls.map((t) => t.slug));
  const related = allPacks.filter((p) => p.items.some((i) => tplSlugs.has(i.template))).slice(0, 3);
  const idx = others.findIndex((o) => o.displayOrder > c.displayOrder);
  const next = [...others.slice(Math.max(0, idx)), ...others].slice(0, 3);
  const faqs = [
    ...c.faqs,
    { q: `What does ${c.nameEn.toLowerCase()} cost?`, a: `Typically ${inr(c.priceMin)} to ${inr(c.priceMax)} depending on size and urgency. You see a range first and the exact amount once a person has checked your plan. Includes the Shell Guarantee.` },
    { q: "What if I am not happy with it?", a: "Ask for rework within 24 hours and we send someone back at no cost. If it still is not right, we refund the affected part." },
    { q: "Is the helper verified?", a: `Yes. ${c.helperReq}` },
  ];
  return (
    <>
      <PageHero eyebrow={lang === "hi" ? c.nameHi : "Shell Quick and Managed"} title={`${c.nameEn},`} em="done right." sub={lang === "hi" ? c.introHi : c.introEn}>
        <div className="flex flex-wrap items-center gap-4"><Pill href={`/app?task=${tpls[0]?.slug ?? slug}`} variant="sun" data-cta={`task_${slug}`}>Start this task</Pill><Link href="/pricing" className="link-quiet font-bold">Estimate the price</Link></div>
        <div className="absolute right-6 top-10 hidden opacity-90 md:block"><Icon name={c.icon} size={150} /></div>
      </PageHero>
      <Section tone="paper">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-ink/20 bg-cream p-5"><h2 className="display text-2xl">Included</h2><ul className="mt-3 space-y-2">{c.included.map((x) => <li key={x} className="flex gap-2"><span className="text-euc">+</span>{x}</li>)}</ul></div>
          <div className="rounded-2xl border border-dashed border-ink/50 p-5"><h2 className="display text-2xl">Not included</h2><ul className="mt-3 space-y-2">{c.notIncluded.map((x) => <li key={x} className="flex gap-2"><span className="text-brick">-</span>{x}</li>)}</ul></div>
          <div className="receipt scallop-b"><h2 className="display text-xl">Typical</h2><div className="receipt-line"><span>Duration</span><span className="leader" /><b>{minutesToText(c.typicalMinutes)}</b></div><div className="receipt-line"><span>Price</span><span className="leader" /><b>{inr(c.priceMin)} to {inr(c.priceMax)}</b></div>{tpls.map((t) => <div key={t.slug} className="receipt-line text-xs opacity-80"><span>{t.nameEn}</span><span className="leader" /><span>{inr(t.baseRate)}/{t.unit}</span></div>)}</div>
        </div>
      </Section>
      <Section tone="dark">
        <h2 className="display text-4xl md:text-5xl">How the job runs</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">{c.steps.map((s, i) => <li key={s} className="rounded-2xl border border-sage/60 p-4" style={{ transform: `rotate(${[-1, 0.8, -0.6, 1][i % 4]}deg)` }}><span className="mono text-3xl text-sand">{String(i + 1).padStart(2, "0")}</span><p className="mt-2">{s}</p></li>)}</ol>
        <p className="mt-8 rounded-2xl bg-forest p-4 text-cream/90"><b>Helpers:</b> {c.helperReq}</p>
      </Section>
      <Section tone="cream">
        <div className="grid items-center gap-8 md:grid-cols-2"><div><h2 className="display text-4xl">Before and after</h2><p className="mt-3">Every job ends with timestamped before and after photos. You compare them with a slider before you approve. These are placeholder drawings until real jobs are published.</p></div><TimeMachine before={roomSvg(false)} after={roomSvg(true)} /></div>
      </Section>
      <Section tone="paper"><h2 className="display mb-6 text-4xl">Sawaal-jawab</h2><Faq items={faqs} /></Section>
      <Section tone="cream">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            {related.length > 0 && <><h2 className="display text-3xl">Related packs</h2><div className="mt-4 flex flex-wrap gap-3">{related.map((p) => <Link key={p.slug} href={`/packs/${p.slug}`} className="chip">{p.nameEn}</Link>)}</div></>}
            <h2 className="display mt-8 text-3xl">Related categories</h2><div className="mt-4 flex flex-wrap gap-3">{next.map((o) => <Link key={o.slug} href={`/tasks/${o.slug}`} className="chip"><Icon name={o.icon} size={22} tone="none" />{o.nameEn}</Link>)}</div>
          </div>
          <div><h2 className="display mb-3 text-3xl">Get notified when we reach your society</h2><EnquiryForm kind="notify" presets={{ message: `Notify me: ${c.nameEn}` }} fields={[{ name: "name", label: "Name", required: true }, { name: "phone", label: "WhatsApp number", type: "tel" }, { name: "society", label: "Society" }]} cta="Notify me" success="Done. We will tell you first." /></div>
        </div>
      </Section>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({ "@context": "https://schema.org", "@graph": [{ "@type": "Service", name: c.nameEn, areaServed: "Delhi", provider: { "@type": "Organization", name: "Shell", url: SITE_URL }, offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: c.priceMin / 100, highPrice: c.priceMax / 100 } }, { "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] })} />
    </>
  );
}
