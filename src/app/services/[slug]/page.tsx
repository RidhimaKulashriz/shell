import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, Section, H2 } from "@/components/Page";
import { Stamp } from "@/components/ui";
import { SERVICE_LINES } from "@/lib/catalog";
import { buildMeta } from "@/lib/site";

const COPY: Record<string, { title: string; hero: string; body: string[]; points: [string, string][]; soon?: boolean }> = {
  quick: {
    title: "Shell Quick: one small task, one helper, one price",
    hero: "Ek chhota kaam. Ek helper. Ek price.",
    body: ["Parcel lena hai, bartan dhone hain, line mein lagna hai. Quick un kaamon ke liye hai jo ek helper ek ghante mein kar de.", "Small jobs mein travel ka kharch aur fee ka floor hota hai, isliye minimum order lagta hai. Padosiyon ke saath Circle banao to price girta hai."],
    points: [["Minimum order", "₹149, taaki chhota kaam bhi helper ke liye theek rahe."], ["Circle", "Wahi kaam tower ke 4 flats mein ek saath, to price per flat kam."], ["Rush", "90 minute mein, sirf society ke andar, thoda zyada price."]],
  },
  managed: {
    title: "Shell Managed: a whole plan with one person accountable",
    hero: "Poora plan. Ek insaan zimmedar.",
    body: ["Guests, shifting, ghar ka reset. Aap ek message likhte ho, hum tasks todte hain, time sync karte hain, helpers lagate hain, aur ek result dete hain.", "Managed plans mein 3 ya usse zyada kaam hote hain, ya hum use Managed mark karte hain. Isme ek coordination fee lagti hai jo receipt mein alag dikhti hai."],
    points: [["Human check", "Har plan ek insaan dekhta hai, phir aap."], ["One timeline", "Groceries, cleaning, decor: sab ek schedule mein, travel buffer ke saath."], ["Backup ready", "Helper late ho to backup pehle se tayyar."]],
  },
  routines: {
    title: "Shell Routines (coming soon): weekly and monthly help",
    hero: "Har hafte, wahi helper, wahi time.",
    body: ["Routines se aap weekly ya monthly kaam schedule kar paoge: bartan, cleaning, groceries. Same-helper preference, pause, skip, auto-pay.", "Abhi ye bana nahi hai, ise hum tab launch karenge jab pehli society mein one-off jobs ka repeat rate dikhne lage."],
    points: [["Pause and skip", "Chhutti par ho? Ek tap."], ["Same helper", "Jise pasand kiya, wahi aata hai."], ["Auto-pay", "Mandate se, aap bhoolo bhi to kaam chalta rahe."]],
    soon: true,
  },
  plus: {
    title: "Shell Plus (coming soon): lower fees, priority help",
    hero: "Ek subscription. Fee kam, priority zyada.",
    body: ["Plus mein platform fee kam hogi, Circle joins free honge, aur priority helpers milenge.", "Ye abhi design mein hai. Waitlist par bataiye ki aapko isme kya chahiye, hum wahi banayenge."],
    points: [["Lower fees", "Fee floor ghatega."], ["Priority", "Pehle offers aapke kaam ko."], ["Perks", "Society ke saath milkar."]],
    soon: true,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = COPY[slug];
  if (!c) return {};
  return buildMeta({ title: c.title, description: c.body[0], path: `/services/${slug}` });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = COPY[slug];
  const line = SERVICE_LINES.find((s) => s.slug === slug);
  if (!c || !line) notFound();
  return (
    <>
      <PageHero eyebrow={line.name} title={c.hero} sub={c.body[0]} tone={slug === "managed" ? "dark" : "cream"}>
        {c.soon ? <Stamp className="text-lg">COMING SOON</Stamp> : <Link href="/waitlist" className="pill pill-sun" data-cta={`service_${slug}`}>Join the waitlist</Link>}
      </PageHero>
      <Section tone="paper">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <div><H2>Kaise kaam karta hai</H2><p className="mt-4 text-lg">{c.body[1]}</p></div>
          <ul className="space-y-4">
            {c.points.map(([t, d], i) => (
              <li key={t} className="rounded-2xl bg-cream p-5 ring-2 ring-tide" style={{ transform: `rotate(${[-0.8, 0.6, -0.4][i]}deg)` }}><p className="font-display text-2xl font-bold">{t}</p><p>{d}</p></li>
            ))}
          </ul>
        </div>
      </Section>
      <Section tone="cream">
        <p className="font-mono text-xs uppercase tracking-widest">Examples</p>
        <ul className="mt-3 flex flex-wrap gap-3 text-lg">{line.examples.map((e) => <li key={e} className="rounded-full border-2 border-tide px-5 py-2">{e}</li>)}</ul>
        <div className="mt-8 flex gap-4"><Link href="/pricing" className="pill pill-forest">Pricing dekho</Link><Link href="/tasks" className="pill pill-line">Saare kaam</Link></div>
      </Section>
    </>
  );
}
