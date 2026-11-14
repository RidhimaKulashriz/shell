import Link from "next/link";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { faqs, helpers, societies, towers } from "@/db/schema";
import { Icon } from "@/components/Icon";
import { EarnCalculator } from "@/components/EarnCalculator";
import { PassportBook } from "@/components/Passport";
import { WaitlistForm } from "@/components/WaitlistForm";
import { HeroComposer } from "@/components/home/HeroComposer";
import { FourJobs, PinnedStory, StampPromises } from "@/components/home/Story";
import { GuardianPath, PackTickets, SocietyFinder } from "@/components/home/Sections";
import { Faq, LinkArrow, Section } from "@/components/site/Bits";
import { HandUnderline, Marquee, Meter, Pill, Reveal, Stamp } from "@/components/ui";
import { publicCounters, mainSociety } from "@/lib/data";
import { getLang, pick } from "@/lib/lang";
import { meta } from "@/lib/seo";
import { catalogForClient, earnRates, hexCounts, packCards, societyList } from "@/lib/site-data";
import { DEMO_SENTENCE, matchKeywords } from "@/lib/keywords";
import { quote, type Size } from "@/lib/pricing";
import { inr } from "@/lib/format";

export const metadata = meta({ title: "Shell | Get comfortable. We've got it.", description: "Write one message. Shell builds the plan, sends verified helpers and stays until the job is done. Starting in one Delhi apartment society.", path: "/" });

export default async function Home({ searchParams }: { searchParams: Promise<{ society?: string }> }) {
  const sp = await searchParams;
  const lang = await getLang();
  const [catalog, packs, rates, socs, hexes, counters, main, faqRows] = await Promise.all([catalogForClient(), packCards(), earnRates(), societyList(), hexCounts(3), publicCounters(), mainSociety(), db.select().from(faqs).where(eq(faqs.scope, "home")).orderBy(asc(faqs.displayOrder))]);
  const tw = main ? await db.select().from(towers).where(eq(towers.societyId, main.id)) : [];
  const hl = await db.select().from(helpers).where(inArray(helpers.displayName, ["Isha Kapoor"]));
  const map = { boundary: main?.boundary ?? [], gates: main?.gates ?? [], towers: tw.map((t) => ({ name: t.name, lat: t.lat, lng: t.lng })), helpers: hl.map((h) => ({ id: h.id, name: h.displayName, lat: h.lat ?? 0, lng: h.lng ?? 0, label: "Isha" })) };
  const demo = matchKeywords(DEMO_SENTENCE).items.flatMap((i) => { const t = catalog.find((c) => c.slug === i.slug); return t ? [{ template: t, qty: i.qty, size: i.size as Size }] : []; });
  const dq = quote({ lines: demo });
  const sample = { lines: dq.lines.map((l) => ({ name: l.name, price: inr(l.price), stamp: true })), total: inr(dq.total) };
  const faqItems = faqRows.map((f) => ({ q: pick(lang, f.q, f.qHi ?? f.q), a: pick(lang, f.a, f.aHi ?? f.a) }));
  const society = socs.find((s) => s.slug === sp.society)?.id;
  const nums: [string, number, string, boolean][] = [["neighbours waiting", counters.waiting, "", counters.waiting > 10], ["helpers verified", counters.helpers, "", counters.helpers > 10], ["jobs completed", counters.jobs, "", counters.jobs > 10], ["average rating", counters.rating, "/5", counters.jobs > 10 && counters.rating > 0]];

  return (
    <>
      {/* H1 hero */}
      <section className="relative overflow-hidden bg-cream px-5 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16">
        <div className="drift blob pointer-events-none absolute -left-32 top-24 h-[420px] w-[520px] bg-forest opacity-[0.12]" aria-hidden />
        <div className="drift blob pointer-events-none absolute -right-24 -top-24 h-[360px] w-[420px] bg-euc opacity-[0.12]" style={{ animationDelay: "-9s" }} aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[1fr_1.05fr]">
          <div className="pt-4 lg:pt-10">
            <span className="hand inline-block -rotate-2 text-3xl text-euc md:text-4xl">Starting in one Delhi society</span>
            <h1 className="display mt-3 text-[clamp(3rem,9.5vw,7rem)]">
              Get comfortable.<br />We&apos;ve <span className="serif-i relative inline-block font-normal">got it<HandUnderline /></span>.
            </h1>
            <p className="mt-8 max-w-lg text-xl">Write one message. We build the plan, send verified helpers, and stay with it until the job is done.</p>
            <p className="mt-2 max-w-lg text-base opacity-75">One message. One plan. One person to ask.</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Pill href="/waitlist" variant="sun" data-cta="hero_primary">Join the waitlist</Pill>
              <Link href="/how-it-works" className="link-quiet font-bold" data-cta="hero_secondary">See how it works</Link>
            </div>
          </div>
          <HeroComposer catalog={catalog} lang={lang} />
        </div>
      </section>
      <div className="border-y border-ink/20 bg-sand py-3 text-lg font-semibold">
        <Marquee items={["Cleaning", "Groceries", "Wardrobe", "Decoration", "Utensils", "Parcel pickup", "Excel help", "Pet walking", "Queueing", "Event help", "Moving help", "Small repairs"]} />
      </div>

      {/* H2 sticky notes */}
      <Section tone="cream">
        <h2 className="display max-w-3xl text-4xl md:text-6xl">Getting things done has become <span className="serif-i">a task</span> in itself.</h2>
        <div className="mt-14 grid gap-12 md:grid-cols-3">
          {[["Trust", "Who is coming into my home? A name, an ID, nothing is certain.", "-3", "mt-0"], ["Quality", "If the work goes wrong, who is accountable? Nobody is.", "2", "md:mt-10"], ["Juggling", "Four apps, four chats, four prices. You manage all of it.", "-1.5", "md:mt-4"]].map(([t, d, r, m], i) => (
            <Reveal key={t} delay={i * 150} className={m}>
              <div className="note hover:!rotate-0 focus-within:!rotate-0" style={{ transform: `rotate(${r}deg)` }} tabIndex={0}>
                <h3 className="hand text-4xl">{t}</h3>
                <p className="mt-2 text-lg leading-snug">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* H3 pinned story */}
      <PinnedStory sample={sample} map={map} />

      {/* H4 */}
      <FourJobs />

      {/* H5 services, asymmetric */}
      <Section tone="paper">
        <h2 className="display text-4xl md:text-6xl">Four ways to <span className="serif-i">get it done.</span></h2>
        <div className="mt-12 grid items-start gap-6 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <Link href="/services/managed" className="block rotate-[-1deg] rounded-2xl border border-ink/20 bg-forest p-7 text-cream shadow-[0_22px_44px_-30px_rgba(5,31,32,0.6)]">
              <div className="flex items-center justify-between"><Icon name="sofa" size={54} tone="sand" /><span className="washi">most plans start here</span></div>
              <h3 className="display mt-4 text-4xl md:text-5xl">Shell Managed</h3>
              <p className="mt-2 max-w-md text-lg text-cream/90">Events, shifting, whole-home resets. One plan, many helpers, one person coordinating.</p>
              <div className="mt-6 flex items-center gap-2 text-xs mono">{["T-24h", "T-12h", "T-6h", "T-3h"].map((x, i) => <span key={x} className="flex items-center gap-2"><span className="rounded-full border border-sage px-2 py-1">{x}</span>{i < 3 && <span className="h-px w-5 bg-sage" />}</span>)}</div>
              <ul className="mt-5 text-sm text-cream/85">{["Guests arriving tomorrow", "Move-in clean and unpack", "Birthday party setup"].map((x) => <li key={x}>+ {x}</li>)}</ul>
              <div className="mt-5"><LinkArrow href="/services/managed">Shell Managed</LinkArrow></div>
            </Link>
          </Reveal>
          <Reveal className="md:col-span-5 md:mt-16" delay={120}>
            <Link href="/services/quick" className="block rotate-[1.5deg] rounded-xl border border-ink/20 bg-paper p-6">
              <div className="flex gap-2"><Icon name="parcel" size={46} /><Icon name="bag" size={46} tone="sage" /></div>
              <h3 className="display mt-3 text-3xl">Shell Quick</h3>
              <p className="mt-1">One small task, done today.</p>
              <ul className="mt-3 text-sm opacity-85">{["Parcel pickup", "Utensils", "Chemist run"].map((x) => <li key={x}>+ {x}</li>)}</ul>
              <div className="mt-4"><LinkArrow href="/services/quick">Shell Quick</LinkArrow></div>
            </Link>
          </Reveal>
          <Reveal className="md:col-span-7 md:-mt-4" delay={200}>
            <div className="tide-band rotate-[1deg] rounded-2xl p-5 md:p-6">
              <Link href="/earn" className="block rounded-xl bg-cream p-6 text-ink">
                <div className="flex items-center gap-3"><Icon name="bicycle" size={50} /><h3 className="display text-3xl">Shell Earn</h3></div>
                <p className="mt-2">Earn while you study, on your own timetable.</p>
                <ul className="mt-3 text-sm">{["Cleaning and organising", "Excel and explaining", "Dog walks and errands"].map((x) => <li key={x}>+ {x}</li>)}</ul>
                <div className="mt-4"><LinkArrow href="/earn">Shell Earn</LinkArrow></div>
              </Link>
            </div>
          </Reveal>
          <Reveal className="md:col-span-5" delay={280}>
            <Link href="/services/routines" className="ticket relative block -rotate-2 border border-dashed border-ink/20 p-6">
              <span className="stamp stamp-brick absolute right-4 top-4 text-[10px]">COMING SOON</span>
              <Icon name="calendar" size={44} />
              <h3 className="display mt-2 text-3xl">Shell Routines</h3>
              <p className="mt-1">Repeating help, same helper, auto-pay.</p>
              <ul className="mt-3 text-sm">{["Weekly utensils", "Monthly deep clean", "Daily dog walk"].map((x) => <li key={x}>+ {x}</li>)}</ul>
              <div className="mt-4"><LinkArrow href="/services/routines">Shell Routines</LinkArrow></div>
            </Link>
          </Reveal>
        </div>
      </Section>

      {/* H6 packs */}
      <Section tone="cream" className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4"><h2 className="display text-4xl md:text-6xl">Packs, <span className="serif-i">ready-made.</span></h2><p className="hand text-2xl">scroll sideways</p></div>
        <div className="mt-8"><PackTickets packs={packs} /></div>
      </Section>

      {/* H7 guardian */}
      <section className="tide-band px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>
            <span className="hand text-3xl text-sand">Shell Guardian</span>
            <h2 className="display mt-1 text-4xl md:text-6xl">From gate to door, <span className="serif-i">you always know.</span></h2>
            <div className="mt-8"><GuardianPath /></div>
          </div>
          <div>
            <StampPromises />
            <p className="mt-8 text-lg">We take no risks: massage, makeup and personal care are closed at launch.</p>
            <p className="mt-2 text-cream/80">If anything feels wrong, press SOS. We respond within 20 seconds.</p>
            <div className="mt-5"><Pill href="/safety" variant="cream">About safety</Pill></div>
          </div>
        </div>
      </section>

      {/* H8 earn teaser */}
      <Section tone="cream">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <PassportBook data={{ name: "Rahul V.", level: "TRUSTED", jobs: 38, rating: 4.8, languages: ["Hindi", "English"], college: "Delhi University", verified: ["ID", "College", "Safety"], stamps: [{ label: "Cleaning", icon: "broom" }, { label: "Groceries", icon: "cart" }, { label: "Utensils", icon: "pan" }, { label: "Decor", icon: "balloon" }] }} />
            <p className="hand mt-4 text-center text-xl">Sample passport</p>
          </div>
          <div>
            <h2 className="display text-4xl md:text-5xl">Earn while you <span className="serif-i">study.</span></h2>
            <p className="mt-3 text-lg">On your own timetable. Every job earns a stamp, and every stamp is a career asset.</p>
            <div className="mt-6"><EarnCalculator rates={rates} /></div>
            <div className="mt-6"><Pill href="/earn" variant="forest" data-cta="home_earn">Get your passport</Pill></div>
          </div>
        </div>
      </Section>

      {/* H9 societies */}
      <Section tone="dark">
        <h2 className="display text-4xl md:text-6xl">Your society, <span className="serif-i">your turn.</span></h2>
        <p className="mt-3 max-w-xl text-cream/85">Hex-level density only. No exact address is ever shown.</p>
        <div className="mt-10 text-ink"><SocietyFinder societies={socs} hexes={hexes} initial={society} /></div>
      </Section>

      {/* H10 honest numbers */}
      <Section tone="paper">
        <h2 className="display text-4xl md:text-5xl">Honest <span className="serif-i">numbers.</span></h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {nums.map(([label, v, suf, show], i) => (
            <div key={label} className="rounded-2xl border border-ink/20 p-5" style={{ transform: `rotate(${[-1, 0.8, -0.6, 1][i]}deg)` }}>
              {show ? <div className="display text-5xl"><Meter value={v} suffix={suf} /></div> : <p className="hand text-2xl leading-tight">We are just getting started, and you could be among the first.</p>}
              <div className="mono mt-2 text-xs uppercase tracking-widest opacity-70">{label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* H11 FAQ */}
      <Section tone="cream">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div className="md:sticky md:top-24 md:self-start"><h2 className="display text-4xl md:text-5xl">Questions, <span className="serif-i">straight answers.</span></h2><p className="hand mt-3 text-2xl">no marketing</p></div>
          <Faq items={faqItems} />
        </div>
      </Section>

      {/* H12 final CTA */}
      <section id="join" className="dark-band px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1fr_1.1fr]">
          <div>
            <Stamp label="Limited list" tone="brick" rot={-6} />
            <h2 className="display mt-4 text-4xl md:text-6xl">Get comfortable. <span className="serif-i">We&apos;ve got it.</span></h2>
            <p className="mt-4 max-w-md text-lg text-cream/85">Add your name. We will tell you first when we reach your society.</p>
          </div>
          <div className="text-ink"><WaitlistForm societies={socs.map((s) => s.name)} initialSociety={sp.society ? (socs.find((s) => s.slug === sp.society)?.name ?? "") : ""} /></div>
        </div>
      </section>
    </>
  );
}
