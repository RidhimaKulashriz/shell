import Link from "next/link";
import { PageHero, Section } from "@/components/Page";
import { Icon } from "@/components/Icon";
import { getCategories } from "@/lib/data";
import { rupees } from "@/lib/pricing";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Home tasks Shell can do in Delhi | Shell", description: "Cleaning, utensils, groceries, errands, wardrobe organising, decoration, tutoring and more. See what is included and typical prices.", path: "/tasks" });
export const dynamic = "force-dynamic";

export default async function Page() {
  const cats = await getCategories();
  return (
    <>
      <PageHero eyebrow="Saare kaam" title={<>Jo bhi ghar mein <span className="font-accent text-euca">atka</span> hai.</>} sub="Solah kaam, sab verified helpers ke saath. Massage, makeup, personal care aur homework karna band hain." />
      <Section tone="paper">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c, i) => (
            <li key={c.slug} style={{ transform: `rotate(${[-1.2, 0.8, -0.5, 1.4, -0.9, 0.5][i % 6]}deg)`, marginTop: i % 3 === 1 ? "1.5rem" : 0 }}>
              <Link href={`/tasks/${c.slug}`} className={`group block rounded-[22px_28px_20px_30px] p-5 ring-2 ring-tide transition-transform hover:-translate-y-1 hover:rotate-0 ${i % 4 === 0 ? "bg-sand" : i % 4 === 2 ? "bg-sage/60" : "bg-cream"}`}>
                <div className="flex items-start justify-between"><Icon name={c.iconId} size={56} /><span className="font-mono text-[11px]">{c.content.duration}</span></div>
                <h2 className="font-display mt-3 text-3xl font-black leading-none">{c.nameEn}</h2>
                <p className="hi text-sm opacity-70">{c.nameHi}</p>
                <p className="mt-2 text-sm">{c.content.intro.split(". ")[0]}.</p>
                <p className="mt-3 font-mono text-sm">{rupees(c.priceMin)} to {rupees(c.priceMax)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
