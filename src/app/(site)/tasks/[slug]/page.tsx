import { notFound } from "next/navigation";
import Link from "next/link";
import { Hero, Section, H2, Faq } from "@/components/page";
import { Icon } from "@/components/icons";
import { catalogBySlug, GENERIC_FAQS, CATALOG } from "@/lib/catalog";
import { allCategories, allPacks } from "@/lib/stats";
import { formatINR, formatDuration } from "@/lib/pricing";
import { ContactForm } from "@/components/site";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = catalogBySlug((await params).slug); if (!c) return {};
  return { title: `${c.name} at home in Delhi`, description: c.intro, alternates: { canonical: `/tasks/${c.slug}` } };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = catalogBySlug(slug); const cats = await allCategories(); const db = cats.find((x) => x.slug === slug);
  if (!c || !db) notFound();
  const packs = (await allPacks()).filter((p) => p.items.some((i) => i.slug === slug));
  const related = CATALOG.filter((x) => x.kind === c.kind && x.slug !== slug).slice(0, 3);
  const faqs = [...c.faqs, ...GENERIC_FAQS(c.name)];
  const steps = ["Tell us what you need", "We confirm the plan and price", `A verified helper arrives. ${c.runNote}`, "You review the photos and approve"];
  const ld = { "@context": "https://schema.org", "@type": "Service", name: c.name, areaServed: "Delhi", description: c.intro, provider: { "@type": "Organization", name: "Shell" }, offers: { "@type": "Offer", priceCurrency: "INR", price: String(db.baseRate / 100) } };
  return (<>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    <Hero eyebrow={c.kind === "managed" ? "Shell Managed" : "Shell Quick"} title={<>{c.name} <span className="italic text-euca">at home</span></>} lead={c.intro}>
      <div className="flex flex-wrap items-center gap-4"><Link href={`/app/new?text=${encodeURIComponent(c.name.toLowerCase())}`} className="btn btn-sun">Start this task</Link>
        <span className="text-sm text-ink/60">From {formatINR(db.baseRate)} per {db.unit} · typically {formatDuration(db.minutesPerUnit * c.qty)}</span></div>
    </Hero>
    <Section tone="white"><div className="grid gap-10 md:grid-cols-2">
      <div><H2 className="text-tide">What&apos;s included</H2><ul className="mt-4 space-y-2">{c.included.map((i) => <li key={i} className="flex gap-3"><Icon name="check" size={20} className="mt-0.5 shrink-0 text-euca" />{i}</li>)}</ul></div>
      <div><H2 className="text-tide">What&apos;s not</H2><ul className="mt-4 space-y-2 text-ink/70">{c.excluded.map((i) => <li key={i} className="flex gap-3"><Icon name="close" size={20} className="mt-0.5 shrink-0 text-danger" />{i}</li>)}</ul></div></div></Section>
    <Section><H2 className="text-tide">How the job runs</H2><ol className="mt-8 grid gap-4 md:grid-cols-4">{steps.map((s, i) => <li key={s} className="border-t-2 border-tide pt-3"><span className="serif text-3xl font-bold text-sage">{i + 1}</span><p className="mt-1 text-sm">{s}</p></li>)}</ol>
      <div className="mt-10 grid gap-4 md:grid-cols-2"><div className="card p-5"><h3 className="text-lg font-semibold">Helpers for this task</h3><p className="mt-1 text-sm text-ink/70">{c.helper}. All verified and trained, with a category quiz passed before they can take this job.</p></div>
        <div className="card p-5"><h3 className="text-lg font-semibold">Before and after</h3><p className="mt-1 text-sm text-ink/70">Photos from real jobs will appear here as we complete them. You always get your own before and after photos.</p></div></div></Section>
    <Section tone="cream"><H2 className="text-tide">Questions about {c.name.toLowerCase()}</H2><div className="mt-6"><Faq items={faqs} /></div></Section>
    {packs.length > 0 && <Section><H2 className="text-tide">Part of these packs</H2><div className="mt-5 flex flex-wrap gap-3">{packs.map((p) => <Link key={p.slug} href={`/packs/${p.slug}`} className="chip">{p.name}</Link>)}</div></Section>}
    <Section tone="white"><div className="grid gap-8 md:grid-cols-2"><div><H2 className="text-tide">Related tasks</H2><div className="mt-5 flex flex-wrap gap-2">{related.map((r) => <Link key={r.slug} href={`/tasks/${r.slug}`} className="chip">{r.name}</Link>)}</div></div>
      <div><h3 className="text-xl font-semibold">Get notified when we reach your society</h3><div className="mt-3"><ContactForm kind="contact" cta="Notify me" fields={[{ name: "name", label: "Name", required: true }, { name: "phone", label: "WhatsApp number", required: true }, { name: "society", label: "Society" }]} success="We'll message you when Shell opens near you." /></div></div></div></Section>
  </>);
}
