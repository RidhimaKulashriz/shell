import Link from "next/link";
import { Composer } from "@/components/home/Composer";
import { FourJobs, PinnedStory, ProblemNotes } from "@/components/home/Story";
import { GuardianPath, Promises } from "@/components/home/Guardian";
import { PackStubs } from "@/components/PackStubs";
import { FaqList } from "@/components/Faq";
import { WaitlistForm } from "@/components/WaitlistForm";
import { WaitlistMap } from "@/components/WaitlistMap";
import { EarnCalc, Passport } from "@/components/Passport";
import { Icon } from "@/components/Icon";
import { Reveal, Underline } from "@/components/ui";
import { T } from "@/lib/i18n";
import { FAQS_HOME } from "@/lib/catalog";
import { getCategories, getPacks, getStats } from "@/lib/data";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({
  title: "Shell | Get comfortable. We've got it.",
  description: "Write one message in Hindi, English or Hinglish. Shell plans it, sends verified helpers and stays until it's done. Starting in one Delhi society.",
  path: "/",
});
export const dynamic = "force-dynamic";

export default async function Home() {
  const [packs, cats, stats] = await Promise.all([getPacks(), getCategories(), getStats()]);
  const counters = [
    { label: "neighbours waiting", v: stats.neighbours },
    { label: "helpers verified", v: stats.helpersVerified },
    { label: "jobs completed", v: stats.jobsCompleted },
  ].filter((c) => c.v > 10);
  if (stats.avgRating && stats.jobsCompleted > 10) counters.push({ label: "average rating", v: stats.avgRating });

  return (
    <>
      {/* H1 */}
      <section className="band-cream relative overflow-hidden px-5 pb-20 pt-8 md:px-10 md:pb-28 md:pt-14">
        <svg className="drift pointer-events-none absolute -right-32 top-40 w-[30rem] text-moss opacity-90 md:-right-16 md:top-6 md:w-[44rem]" viewBox="0 0 400 360" aria-hidden="true">
          <path fill="currentColor" d="M60 150 C40 70 120 10 200 30 C290 50 370 40 380 140 C390 230 320 330 220 340 C130 350 80 250 60 150Z" />
        </svg>
        <div className="relative mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.02fr_1fr] md:items-start">
          <div className="md:pt-10">
            <p className="hand -rotate-2 text-3xl text-euca md:text-4xl"><T k="hero.eyebrow" /></p>
            <h1 className="font-display mt-3 text-[3.4rem] font-black leading-[0.92] tracking-tight sm:text-7xl md:text-[5.6rem]">
              <T k="hero.h1a" /><br />
              <T k="hero.h1b1" />
              <Underline className="font-accent !font-normal text-euca"><T k="hero.h1b2" />.</Underline>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-snug"><T k="hero.sub2" /></p>
            <p className="mt-2 max-w-md text-sm text-euca"><T k="hero.sub" /></p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link href="/waitlist" className="pill pill-sun" data-cta="hero_waitlist"><T k="cta.waitlist" /></Link>
              <Link href="/how-it-works" className="font-semibold underline decoration-sun decoration-[3px] underline-offset-[6px]" data-cta="hero_how"><T k="cta.how" /></Link>
            </div>
          </div>
          <div className="md:mt-6"><Composer /></div>
        </div>
      </section>

      {/* H2 */}
      <section className="band-paper px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="hand text-3xl text-euca">Teen cheezein jo ghar mein kaam karwane se rokti hain</p>
          <div className="mt-8"><ProblemNotes /></div>
        </div>
      </section>

      {/* H3 */}
      <section className="band-dark" aria-label="How one message becomes one result">
        <div className="mx-auto max-w-7xl"><PinnedStory /></div>
      </section>

      {/* H4 */}
      <section className="band-cream px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-5xl font-black leading-[0.95] md:text-7xl">Four jobs, <span className="font-accent text-euca">one</span> bill.</h2>
          <p className="mt-3 max-w-xl text-lg text-ink/75">Aaj ek party ke liye chaar log, chaar chat, chaar price. Shell mein ek message, ek receipt, aur ek insaan jisse poochh sakte ho.</p>
          <div className="mt-10"><FourJobs /></div>
        </div>
      </section>

      {/* H5 */}
      <section className="band-paper px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display max-w-2xl text-5xl font-black leading-[0.95] md:text-6xl">Chhota kaam ho ya poora plan.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-6 md:grid-rows-[auto_auto]">
            <Reveal rot={-1} className="md:col-span-4 md:row-span-2">
              <Link href="/services/managed" className="band-dark relative block h-full overflow-hidden rounded-[34px_26px_40px_28px] p-7 md:p-10" data-cta="services_managed">
                <span className="stamp stamp-green absolute right-6 top-6 !text-sage !mix-blend-normal">POPULAR</span>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-sage">Shell Managed</p>
                <h3 className="font-display mt-2 max-w-md text-4xl font-black leading-none md:text-6xl">Poora plan, ek zimmedar.</h3>
                <p className="mt-3 max-w-md text-cream/85">Events, shifting, ghar ka reset. Hum tasks todte hain, time sync karte hain aur ek result dete hain.</p>
                <svg viewBox="0 0 420 60" className="mt-7 w-full max-w-lg" aria-hidden="true">
                  <path d="M10 30 H410" stroke="#8EB69B" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
                  {["T-24h", "T-12h", "T-6h", "T-3h"].map((l, i) => (
                    <g key={l}><circle cx={30 + i * 120} cy="30" r="9" fill="#F2C318" stroke="#051F20" strokeWidth="3" /><text x={30 + i * 120} y="56" textAnchor="middle" fill="#DAF1DE" fontSize="12" fontFamily="DM Mono, monospace">{l}</text></g>
                  ))}
                </svg>
                <ul className="mt-6 flex flex-wrap gap-2 text-sm">{["Guests aa rahe hain", "Move-in", "Full home organising"].map((x) => <li key={x} className="rounded-full border border-sage/60 px-3 py-1">{x}</li>)}</ul>
                <span className="mt-6 inline-block text-lg font-semibold text-sun">Dekho kaise →</span>
              </Link>
            </Reveal>
            <Reveal rot={2} delay={120} className="md:col-span-2">
              <Link href="/services/quick" className="relative block rounded-[22px_30px_20px_26px] bg-sand p-6 ring-2 ring-tide" data-cta="services_quick">
                <div className="flex items-start justify-between"><div><p className="font-mono text-xs uppercase tracking-[0.2em]">Shell Quick</p><h3 className="font-display mt-1 text-3xl font-black leading-none">Ek kaam, ek price.</h3></div><div className="flex"><Icon name="parcel" size={52} /><Icon name="bag" size={52} className="-ml-3 mt-3" /></div></div>
                <p className="mt-3 text-sm">Parcel, bartan, queue, chhote errands.</p>
                <span className="mt-3 inline-block font-semibold underline decoration-wavy underline-offset-4">Quick dekho →</span>
              </Link>
            </Reveal>
            <Reveal rot={-1.5} delay={220} className="md:col-span-2">
              <div className="band-tide rounded-[30px] p-3">
                <Link href="/earn" className="bg-cream block rotate-1 rounded-[22px_26px_28px_20px] p-6" data-cta="services_earn">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-euca">Shell Earn</p>
                  <h3 className="font-display mt-1 text-3xl font-black leading-none">Padhai ke saath kamai.</h3>
                  <p className="mt-2 text-sm">Cleaning, tutoring, Excel. Apne timetable ke hisaab se.</p>
                  <span className="mt-3 inline-block font-semibold underline decoration-wavy decoration-sun underline-offset-4">Passport banao →</span>
                </Link>
              </div>
            </Reveal>
            <Reveal rot={1} delay={300} className="md:col-span-6">
              <Link href="/services/routines" className="relative flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-tide/60 bg-paper px-6 py-5" data-cta="services_routines">
                <div><p className="font-mono text-xs uppercase tracking-[0.2em]">Shell Routines</p><p className="font-display text-2xl font-bold">Har hafte, wahi helper, wahi time.</p></div>
                <span className="stamp">COMING SOON</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* H6 */}
      <section className="band-cream px-5 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-5xl font-black leading-[0.95] md:text-6xl">Packs, <span className="font-accent text-euca">tayyar</span> plans.</h2>
            <Link href="/packs" className="font-semibold underline decoration-wavy decoration-sun underline-offset-4">Saare packs →</Link>
          </div>
          <p className="hand mt-1 text-2xl text-euca">Drag karo, ya arrow keys se chalo.</p>
          <PackStubs packs={packs} />
        </div>
      </section>

      {/* H7 */}
      <section className="band-tide px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-sage">Shell Guardian</p>
              <h2 className="font-display mt-2 text-5xl font-black leading-[0.95] md:text-6xl">Gate se tower, tower se door.</h2>
              <div className="mt-8"><GuardianPath /></div>
            </div>
            <div className="md:pt-24">
              <Promises />
            </div>
          </div>
          <p className="hand mt-12 max-w-2xl text-3xl leading-tight text-sand">Hum kuch bhi risky nahi lete: massage, makeup aur personal care launch par band hain.</p>
          <Link href="/safety" className="pill pill-line mt-6 !text-cream">Safety page dekho</Link>
        </div>
      </section>

      {/* H8 */}
      <section className="band-cream px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-2 md:items-center">
          <div className="order-2 md:order-1"><Passport /></div>
          <div className="order-1 md:order-2">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-euca">Shell Earn</p>
            <h2 className="font-display mt-2 text-5xl font-black leading-[0.95] md:text-6xl">Padhai ke saath <Underline className="font-accent !font-normal text-euca">kamai</Underline>.</h2>
            <p className="mt-4 text-lg">Apne timetable ke hisaab se. Har kaam passport mein stamp banta hai, jo internship aur job mein kaam aata hai.</p>
            <div className="mt-6"><EarnCalc categories={cats.map((c) => ({ slug: c.slug, name: c.nameEn, rate: c.baseRate / 100, durationMin: c.content.durationMin }))} /></div>
            <Link href="/earn" className="pill pill-sun mt-6" data-cta="earn_passport">Passport banao</Link>
          </div>
        </div>
      </section>

      {/* H9 */}
      <section className="band-dark px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display max-w-3xl text-5xl font-black leading-[0.95] md:text-6xl">Aapki society <span className="font-accent text-sun">kab</span>?</h2>
          <p className="mt-3 max-w-xl text-cream/80">Jahan sabse zyada padosi judte hain, hum wahan pehle aate hain. Map mein sirf hex dikhta hai, koi ghar nahi.</p>
          <div className="mt-10"><WaitlistMap initialSlug="sunrise-heights-dwarka" /></div>
        </div>
      </section>

      {/* H10 */}
      <section className="band-paper px-5 py-16 md:px-10">
        <div className="mx-auto max-w-5xl">
          {counters.length > 0 ? (
            <ul className="flex flex-wrap items-end justify-around gap-8">
              {counters.map((c) => <li key={c.label} className="text-center"><p className="font-display text-6xl font-black tabular-nums">{c.v}</p><p className="font-mono text-xs uppercase tracking-widest">{c.label}</p></li>)}
            </ul>
          ) : (
            <p className="hand -rotate-1 text-center text-4xl leading-tight text-euca md:text-5xl">Hum abhi shuru kar rahe hain, aap pehle log ho sakte ho.</p>
          )}
          <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-widest opacity-60">Asli numbers, live database se. Jab tak meaningful nahi, hum dikhate nahi.</p>
        </div>
      </section>

      {/* H11 */}
      <section className="band-cream px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.8fr_1.6fr]">
          <div className="md:sticky md:top-28 md:self-start">
            <h2 className="font-display text-5xl font-black leading-[0.95]">Aksar poochhe jaane wale sawaal.</h2>
            <p className="hand mt-3 text-2xl text-euca">Seedha jawab, bina marketing ke.</p>
          </div>
          <FaqList items={FAQS_HOME} />
        </div>
      </section>

      {/* H12 */}
      <section className="band-dark px-5 py-20 md:px-10 md:py-28" id="join">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-center text-5xl font-black leading-[0.95] md:text-7xl">Pehle <span className="font-accent text-sun">logon</span> mein aao.</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-cream/80">Naam, number, society aur kya karwana hai. Baaki hum dekh lenge. Tension mat le.</p>
          <div className="mt-10"><WaitlistForm /></div>
        </div>
      </section>
    </>
  );
}
