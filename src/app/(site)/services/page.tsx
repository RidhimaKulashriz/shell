import Link from "next/link";
import { Icon } from "@/components/Icon";
import { LinkArrow, PageHero, Section } from "@/components/site/Bits";
import { meta } from "@/lib/seo";
import { categoryList } from "@/lib/site-data";
import { getLang, pick } from "@/lib/lang";
import { inr } from "@/lib/format";

export const metadata = meta({ title: "Services", description: "Shell Quick for single tasks, Shell Managed for events and resets, Shell Earn for helpers, Shell Routines coming soon. Sixteen task categories.", path: "/services" });

export default async function Page() {
  const [cats, lang] = [await categoryList(), await getLang()];
  const lines = [["quick", "bag", "Shell Quick", "Single small tasks. Minimum order applies.", "/services/quick"], ["managed", "sofa", "Shell Managed", "Events, shifting and full-home resets with one coordinator.", "/services/managed"], ["routines", "calendar", "Shell Routines", "Weekly and monthly help. Coming soon.", "/services/routines"], ["plus", "star", "Shell Plus", "Subscription with perks. Later.", "/services/plus"]];
  return (
    <>
      <PageHero eyebrow={pick(lang, "jo chahiye wo karwao", "जो चाहिए, करवाइए")} title={pick(lang, "Chaar tareeke,", "चार तरीक़े,")} em={pick(lang, "ek Shell.", "एक Shell।")} />
      <Section tone="paper" className="!py-12">
        <div className="grid gap-5 md:grid-cols-4">{lines.map(([k, ic, n, d, h], i) => <Link key={k} href={h} className="rounded-[22px] border-2 border-ink bg-cream p-5" style={{ transform: `rotate(${[-1, 1, -0.5, 1.2][i]}deg)` }}><Icon name={ic} size={44} /><h2 className="display mt-2 text-2xl">{n}</h2><p className="mt-1 text-sm">{d}</p>{(k === "routines" || k === "plus") && <span className="stamp stamp-brick mt-2 text-[10px]">coming soon</span>}</Link>)}</div>
      </Section>
      <Section tone="cream">
        <h2 className="display text-4xl md:text-5xl">Sab kaam, <span className="serif-i">ek jagah.</span></h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c, i) => (
            <Link key={c.slug} href={`/tasks/${c.slug}`} className="flex gap-4 rounded-2xl border-2 border-ink bg-paper p-4 transition-transform hover:-translate-y-1" style={{ transform: `rotate(${((i * 7) % 5 - 2) * 0.35}deg)` }}>
              <Icon name={c.icon} size={52} /><span><b className="display block text-xl">{lang === "hi" ? c.nameHi : c.nameEn}</b><span className="mono text-xs opacity-70">{inr(c.priceMin)} to {inr(c.priceMax)}</span></span>
            </Link>
          ))}
        </div>
        <p className="mt-10"><LinkArrow href="/pricing">Pricing and estimator</LinkArrow></p>
      </Section>
    </>
  );
}
