import Link from "next/link";
import { Faq, PageHero, Section } from "@/components/site/Bits";
import { EarnCalculator } from "@/components/EarnCalculator";
import { PassportBook } from "@/components/Passport";
import { Pill } from "@/components/ui";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { earnRates } from "@/lib/site-data";
import { meta } from "@/lib/seo";
import { getLang, pick } from "@/lib/lang";

export const metadata = meta({ title: "Shell Earn: earn with a skill you have", description: "Padhai ke saath kamai. Flexible hours, a Skill Passport, free weekly payouts. For 18+ college students, freelancers and homemakers.", path: "/earn" });

export default async function Page() {
  const [rates, lang, f] = [await earnRates(), await getLang(), await db.select().from(faqs).where(eq(faqs.scope, "help-helper"))];
  return (
    <>
      <PageHero tone="dark" eyebrow="Shell Earn" title={pick(lang, "Padhai ke saath", "पढ़ाई के साथ")} em={pick(lang, "kamai.", "कमाई।")} sub="Apne timetable ke hisaab se. Earn from tasks you are already good at, inside the society next door.">
        <div className="flex flex-wrap gap-4"><Pill href="/earn/apply" variant="sun" data-cta="earn_apply">Passport banao</Pill><Link href="#calc" className="link-quiet font-bold">Calculator dekho</Link></div>
      </PageHero>
      <Section tone="cream">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-ink bg-paper p-5"><h2 className="display text-3xl">Kaun join kar sakta hai</h2><ul className="mt-3 space-y-2">{["18 or older, college students first", "Freelancers and homemakers with a skill", "Government ID, college ID or proof of work", "A phone with GPS and a UPI or bank account"].map((x) => <li key={x} className="flex gap-2"><span className="text-euc">+</span>{x}</li>)}</ul></div>
          <div className="rounded-2xl border-2 border-dashed border-ink/50 p-5"><h2 className="display text-3xl">Kaun nahi</h2><ul className="mt-3 space-y-2">{["Under 18, no exceptions", "No valid ID", "Anyone with a safety-related ban elsewhere on Shell"].map((x) => <li key={x} className="flex gap-2"><span className="text-brick">-</span>{x}</li>)}</ul></div>
        </div>
      </Section>
      <Section tone="paper" id="calc"><div className="grid items-start gap-10 md:grid-cols-2"><div><h2 className="display text-4xl md:text-5xl">Kitna kama sakte ho?</h2><p className="mt-3 text-lg">Hours per week x category average rate x your level. Payout is after Shell&apos;s commission (20 to 28 percent depending on level).</p></div><EarnCalculator rates={rates} withLevel /></div></Section>
      <Section tone="dark">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div><h2 className="display text-4xl md:text-5xl">Skill Passport</h2><p className="mt-4 text-lg">Every category you complete earns a stamp. Levels are visas: Starter, Trusted, Pro, Elite. A QR link verifies it publicly and you can export a PDF resume for internships.</p>
            <ul className="mt-5 space-y-1 mono text-sm">{[["Starter", "0 to 10 jobs"], ["Trusted", "11 to 40 jobs, rating 4.6+"], ["Pro", "41 to 120, Managed eligible"], ["Elite", "121+, top rating, low cancellations"]].map(([a, b]) => <li key={a}>{a.padEnd(8, " ")} {b}</li>)}</ul></div>
          <PassportBook data={{ name: "Priya S.", level: "PRO", jobs: 62, rating: 4.9, languages: ["Hindi", "English"], college: "Miranda House", verified: ["ID", "College", "Safety"], stamps: [{ label: "Cleaning", icon: "broom" }, { label: "Decor", icon: "balloon" }, { label: "Events", icon: "cake" }, { label: "Wardrobe", icon: "hanger" }, { label: "Errands", icon: "scooter" }] }} />
        </div>
      </Section>
      <Section tone="cream">
        <h2 className="display text-4xl">Ek din, helper ke saath</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-5">{[["8:00", "Class"], ["12:30", "Offer: Tower C, 90 min"], ["1:00", "Check in with door OTP"], ["2:30", "Photos, check-out"], ["Fri", "Free weekly payout"]].map(([t, d], i) => <li key={t} className="rounded-2xl border-2 border-ink bg-paper p-4" style={{ transform: `rotate(${[-1, 0.8, -0.5, 1, -0.7][i]}deg)` }}><span className="mono text-euc">{t}</span><p className="mt-1 font-semibold">{d}</p></li>)}</ol>
        <div className="mt-10 grid gap-6 md:grid-cols-3">{[["Training", "Short modules per category, quizzes at 80 percent, and a mandatory safety module before your first job."], ["Payouts", "Weekly is free. Instant has a small fee, waived at Elite. Paid after the customer approves."], ["Safety for you", "SOS, report a customer, trusted-contact live link, and never alone with risky categories."]].map(([t, d]) => <div key={t}><h3 className="display text-2xl">{t}</h3><p className="mt-1">{d}</p></div>)}</div>
      </Section>
      <Section tone="paper"><h2 className="display mb-6 text-4xl">Application in 7 steps</h2><ol className="mb-10 flex flex-wrap gap-3">{["Basics", "Government ID", "College ID", "Selfie check", "Skills", "Availability", "Payout and agreement"].map((s, i) => <li key={s} className="chip cursor-default"><span className="mono">{i + 1}</span> {s}</li>)}</ol><Faq items={f.map((x) => ({ q: x.q, a: x.a }))} /><div className="mt-8"><Pill href="/earn/apply" variant="sun">Start your application</Pill></div></Section>
    </>
  );
}
