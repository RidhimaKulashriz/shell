import Link from "next/link";
import { PageHero, Section, H2 } from "@/components/Page";
import { EarnCalc, Passport } from "@/components/Passport";
import { LEVELS } from "@/lib/levels";
import { FaqList } from "@/components/Faq";
import { Icon } from "@/components/Icon";
import { getCategories } from "@/lib/data";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Shell Earn: padhai ke saath kamai", description: "Earn on your own timetable inside your society. Verified, trained, paid weekly or instantly, with a Skill Passport that doubles as a CV.", path: "/earn" });
export const dynamic = "force-dynamic";

const DAY = [["7:30 am", "Online toggle on, first offer: bartan, Tower B, 40 min"], ["9:00 am", "Class. Vacation mode keeps offers off"], ["1:15 pm", "Excel help for a neighbour, 90 min, ₹420 payout"], ["4:00 pm", "Door OTP, check-in, checklist ticks, photos"], ["6:30 pm", "Check-out, rating, tip. Streak +1"]];
const FAQ = [
  { q: "Kya main college student hoon, to apply kar sakta/sakti hoon?", a: "Haan, 18+ ho, ID ho, aur ek safety training pass karo. College students ke liye hi bana hai." },
  { q: "Payout kab milta hai?", a: "Weekly payout free hai. Instant payout par chhoti si fee lagti hai, Pro aur Elite ke liye maaf." },
  { q: "Kya main kisi bhi kaam ko mana kar sakta/sakti hoon?", a: "Haan. Koi bhi risky lage to bina penalty ke mana karo." },
  { q: "Customer ka number mil jayega?", a: "Nahi. Masked call aur in-app chat. Ye aapko bhi bachata hai." },
];

export default async function Page() {
  const cats = await getCategories();
  return (
    <>
      <PageHero eyebrow="Shell Earn" title={<>Padhai ke saath <span className="font-accent text-euca">kamai</span>.</>} sub="Apne timetable ke hisaab se, apni hi society mein. Har kaam ka stamp aapki Skill Passport mein jata hai.">
        <Link href="/waitlist?role=earn" className="pill pill-sun" data-cta="earn_apply">Passport banao</Link>
      </PageHero>
      <Section tone="dark">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <H2>Kaun judh sakta hai</H2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-moss p-5"><p className="font-display text-2xl font-bold">Haan</p><ul className="mt-2 space-y-1 text-sm"><li>18+ college students</li><li>Freelancers</li><li>Homemakers with a skill</li></ul></div>
              <div className="rounded-3xl border-2 border-dashed border-sage/60 p-5"><p className="font-display text-2xl font-bold">Nahi</p><ul className="mt-2 space-y-1 text-sm"><li>18 se kam</li><li>Bina ID ke</li></ul></div>
            </div>
          </div>
          <EarnCalc categories={cats.map((c) => ({ slug: c.slug, name: c.nameEn, rate: c.baseRate / 100, durationMin: c.content.durationMin }))} />
        </div>
      </Section>
      <Section tone="cream">
        <H2>Ek din helper ka</H2>
        <ol className="relative mt-8 max-w-2xl border-l-4 border-dotted border-tide/40 pl-8">
          {DAY.map(([t, d]) => <li key={t} className="relative mb-6"><span className="absolute -left-[2.55rem] top-1 h-4 w-4 rounded-full bg-sun ring-4 ring-cream" aria-hidden="true" /><p className="font-mono text-xs uppercase tracking-widest text-euca">{t}</p><p className="text-lg">{d}</p></li>)}
        </ol>
      </Section>
      <Section tone="paper">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <Passport />
          <div>
            <H2>Skill Passport aur levels</H2>
            <ul className="mt-5 space-y-2">
              {LEVELS.map((l) => <li key={l.name} className="flex items-baseline justify-between rounded-xl bg-cream px-4 py-2 ring-1 ring-tide"><span className="font-display text-xl font-bold">{l.name}</span><span className="font-mono text-xs">{l.jobs}</span></li>)}
            </ul>
            <p className="mt-4">QR link se koi bhi aapka verified record dekh sakta hai, aur PDF resume internship ke liye export hota hai. Aap chunte ho kya dikhana hai.</p>
          </div>
        </div>
      </Section>
      <Section tone="tide">
        <div className="grid gap-8 md:grid-cols-3">
          {[["Training", "Chhote modules, 5 sawaal ka quiz, pass mark 80%. Safety module mandatory.", "book"], ["Flexible hours", "Class timetable import, vacation mode, daily cap. Aap hi tay karte ho.", "calendar"], ["Safe by default", "SOS, report a customer, risky categories band, kabhi akele nahi.", "shield"]].map(([t, d, ic], i) => (
            <div key={t} className="rounded-3xl bg-forest p-6" style={{ transform: `rotate(${[-1, 1, -0.6][i]}deg)` }}><Icon name={ic} size={44} className="text-cream" /><p className="font-display mt-2 text-3xl font-bold">{t}</p><p className="mt-1 text-cream/85">{d}</p></div>
          ))}
        </div>
      </Section>
      <Section tone="cream">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <H2>Apply: 7 step</H2>
            <ol className="mt-5 space-y-2 font-mono text-sm">{["Basics", "Government ID", "College ID", "Selfie check", "Skills", "Availability", "Payout and agreement"].map((s, i) => <li key={s} className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-tide">{i + 1}</span>{s}</li>)}</ol>
            <p className="mt-4 text-sm opacity-75">Estimates, guarantee nahi. Real earnings jobs ki availability par depend karte hain.</p>
            <Link href="/waitlist?role=earn" className="pill pill-sun mt-5">Apply ke liye list mein judo</Link>
          </div>
          <FaqList items={FAQ} />
        </div>
      </Section>
    </>
  );
}
