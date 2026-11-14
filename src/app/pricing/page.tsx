import { PageHero, Section, H2 } from "@/components/Page";
import { Estimator } from "@/components/Estimator";
import { FaqList } from "@/components/Faq";
import { Icon } from "@/components/Icon";
import { getCategories } from "@/lib/data";
import { DEFAULT_CONFIG, rupees } from "@/lib/pricing";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Shell pricing and estimator", description: "Transparent ranges, an interactive estimator, platform and coordination fees explained, and the Shell Guarantee.", path: "/pricing" });
export const dynamic = "force-dynamic";

const FAQ = [
  { q: "Kya koi hidden charge hai?", a: "Nahi. Receipt mein har line dikhti hai: kaam, urgency, Circle discount, platform fee, coordination fee. Total unhi ka jod hai." },
  { q: "Platform fee kyun?", a: `Ye payments, safety, support aur guarantee ka kharch uthati hai. Hum ${DEFAULT_CONFIG.feePercent * 100}% lete hain, lekin kam se kam ${rupees(DEFAULT_CONFIG.feeFloor)}.` },
  { q: "Coordination fee kab lagti hai?", a: `Jab plan mein 3 ya usse zyada kaam hon, ya hum use Managed mark karein. ${rupees(DEFAULT_CONFIG.coordinationFee)} flat. Isme time sync, backup helper aur ek insaan ka dhyaan shaamil hai.` },
  { q: "Minimum order kitna hai?", a: `${rupees(DEFAULT_CONFIG.minOrder)}. Chhote kaam ke liye helper ka aana-jaana bhi hota hai, isliye.` },
  { q: "Tip kaise kaam karti hai?", a: "Kaam approve karne ke baad tip de sakte ho. 100% helper ko jaati hai." },
];

export default async function Page() {
  const cats = await getCategories();
  return (
    <>
      <PageHero eyebrow="Seedha hisaab" title={<>Price kaise <span className="font-accent text-euca">bante</span> hain.</>} sub="Kaam ka time × rate + travel + fee. Society ke andar travel zero. Kuch bhi chhupa nahi.">
        <p className="inline-block rounded-2xl bg-paper px-5 py-3 font-mono text-sm ring-2 ring-tide">task = rate × quantity × size · total = subtotal × urgency × (1 − circle) + travel + platform fee + coordination fee</p>
      </PageHero>
      <Section tone="paper">
        <H2 className="mb-8">Apna estimate banao</H2>
        <Estimator categories={cats.map((c) => ({ slug: c.slug, name: c.nameEn, icon: c.iconId, rate: c.baseRate / 100, unit: c.content.unit, durationMin: c.content.durationMin }))} />
      </Section>
      <Section tone="dark">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            ["Platform fee", `max(${rupees(DEFAULT_CONFIG.feeFloor)}, ${DEFAULT_CONFIG.feePercent * 100}% of subtotal). Payments, safety, support.`, "rupee"],
            ["Coordination fee", `${rupees(DEFAULT_CONFIG.coordinationFee)} when 3+ tasks or Managed. Ek insaan poore plan ko sambhalta hai.`, "calendar"],
            ["Shell Guarantee", "Rework 24 ghante mein free, damage cover limit tak, aur paisa tab tak hamare paas jab tak aap approve na karo.", "shield"],
          ].map(([t, d, ic], i) => (
            <div key={t} className="rounded-3xl bg-moss p-6" style={{ transform: `rotate(${[-1, 0.8, -0.5][i]}deg)` }}><Icon name={ic} size={44} className="text-cream" /><p className="font-display mt-2 text-3xl font-bold">{t}</p><p className="mt-2 text-cream/85">{d}</p></div>
          ))}
        </div>
      </Section>
      <Section tone="cream">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <H2>Khud karne ka bhi to time lagta hai</H2>
            <p className="mt-4 text-lg">Ek 3 BHK ki safai 3 ghante, groceries 90 minute, wardrobe 2 ghante. Saade chhe ghante ek weekend ka. Shell ke saath wo ghante aapke.</p>
          </div>
          <table className="w-full self-start text-left font-mono text-sm">
            <thead><tr className="border-b-2 border-tide"><th className="py-2">Kaam</th><th>Khud</th><th>Shell</th></tr></thead>
            <tbody>
              {[["Safai 3 rooms", "3 hr", "0 hr"], ["Groceries", "1.5 hr", "0 hr"], ["Wardrobe", "2 hr", "0 hr"], ["Aapka weekend", "−6.5 hr", "wapas"]].map((r) => <tr key={r[0]} className="border-b border-dashed border-tide/40"><td className="py-2">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}
            </tbody>
          </table>
        </div>
      </Section>
      <Section tone="paper"><div className="grid gap-10 md:grid-cols-[0.8fr_1.6fr]"><H2>Pricing FAQ</H2><FaqList items={FAQ} /></div></Section>
    </>
  );
}
