import { notFound } from "next/navigation";
import { db } from "@/db";
import { packs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Hero, Section, H2, Faq } from "@/components/page";
import { PackCustomizer } from "@/components/site";
import { Receipt } from "@/components/ui";
import { CATALOG } from "@/lib/catalog";
import { packEstimate } from "@/lib/content";
import { formatINR, formatRange, formatDuration } from "@/lib/pricing";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const [p] = await db.select().from(packs).where(eq(packs.slug, (await params).slug)); return p ? { title: p.name, description: p.description } : {}; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const [p] = await db.select().from(packs).where(eq(packs.slug, (await params).slug)); if (!p) notFound();
  const e = packEstimate(p.items);
  const timeline = [...p.items].sort((a, b) => b.offsetHours - a.offsetHours);
  return (<>
    <Hero eyebrow="Pack" title={p.name} lead={p.description} />
    <Section tone="white"><div className="grid items-start gap-10 md:grid-cols-2">
      <Receipt title={p.name} subtitle="Sample receipt" lines={e.lines.map((l) => ({ name: l.name, detail: formatDuration(l.durationMin), amount: formatRange(l.price), stamped: true }))} fees={[{ label: "Platform fee", amount: formatINR(e.platformFee) }, ...(e.coordinationFee ? [{ label: "Coordination fee", amount: formatINR(e.coordinationFee) }] : [])]} total={formatRange(e.total)} totalLabel="Estimated total" />
      <div><H2 className="text-tide">How it runs</H2><ol className="mt-6 space-y-5 border-l-2 border-dashed border-euca/40 pl-6">{timeline.map((i) => <li key={i.slug} className="relative"><span className="absolute -left-[2.1rem] top-1 h-3 w-3 rounded-full bg-euca" /><div className="text-xs font-bold uppercase tracking-wider text-euca">{i.offsetHours > 0 ? `T minus ${i.offsetHours} hours` : i.offsetHours === 0 ? "During the event" : `${-i.offsetHours} hours after`}</div><div className="font-semibold">{CATALOG.find((c) => c.slug === i.slug)!.name}</div><div className="text-sm text-ink/70">{i.note}</div></li>)}</ol>
        <p className="mt-6 text-sm text-ink/70"><strong>Helpers involved:</strong> {p.helperTypes.join(", ")}.</p></div></div></Section>
    <Section><PackCustomizer items={p.items} packSlug={p.slug} /></Section>
    <Section tone="cream"><H2 className="text-tide">Questions</H2><div className="mt-6"><Faq items={[{ q: "Can I change the tasks?", a: "Yes. Remove or add tasks before you approve, and the receipt updates instantly." }, { q: "What if my deadline is sooner?", a: "Choose same-day or Rush when you order. The plan is re-timed and the price updates." }, { q: "Is it one helper or many?", a: "Usually several, each matched to their task. You deal with Shell, and we coordinate them." }]} /></div></Section></>);
}
