import Link from "next/link";
import { Icon } from "@/components/icons";
import { ComposerDemo, FourJobs, EarnCalculator, SocietyFinder, WaitlistForm, PinnedStory } from "@/components/home";
import { publicStats, hexCells, societySearch, allPacks } from "@/lib/stats";
import { FAQS, packEstimate } from "@/lib/content";
import { formatINR } from "@/lib/pricing";
import { db } from "@/db";
import { societies } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [stats, cells, initial, packs, socs] = await Promise.all([publicStats(), hexCells(), societySearch(""), allPacks(), db.select({ n: societies.name }).from(societies)]);
  const nums = [
    { v: stats.waiting, l: "neighbours waiting" }, { v: stats.helpers, l: "verified helpers" }, { v: stats.jobs, l: "jobs completed" }, { v: Number(stats.rating.toFixed(1)), l: "average rating", min: 3 },
  ];
  const ld = [
    { "@context": "https://schema.org", "@type": "Organization", name: "Shell", slogan: "Get comfortable. We've got it.", areaServed: "Delhi" },
    { "@context": "https://schema.org", "@type": "WebSite", name: "Shell", url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000" },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {/* H1 hero */}
      <section className="grain relative overflow-hidden bg-cream/50">
        <svg className="drift pointer-events-none absolute -left-24 top-20 hidden h-[420px] w-[420px] text-moss/10 lg:block" viewBox="0 0 200 200" aria-hidden><path fill="currentColor" d="M44 24c28-22 86-10 108 22s14 78-20 100-86 14-104-24S16 46 44 24z" /></svg>
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:px-8 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:py-20">
          <div>
            <p className="text-2xl text-euca" style={{ fontFamily: "var(--font-hand)", transform: "rotate(-2deg)", display: "inline-block" }}>Starting in one Delhi society</p>
            <h1 className="mt-2 text-[clamp(2.6rem,6vw,4.6rem)] font-semibold leading-[1.02] text-tide">
              Get comfortable.<br />We&apos;ve{" "}
              <span className="relative inline-block italic" style={{ fontFamily: "var(--font-serif)" }}>got it.
                <svg className="draw absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" aria-hidden><path className="draw-line" d="M2 8c40-7 90-8 196-2" stroke="#f2c318" strokeWidth="5" strokeLinecap="round" /></svg>
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-ink/75">Write one message. We plan it, send verified helpers, and stay with you until it&apos;s done. You deal with Shell, not with a list of strangers.</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href="/waitlist" className="btn btn-sun">Join the waitlist</Link>
              <Link href="/how-it-works" className="text-sm font-semibold text-euca underline underline-offset-4">See how it works</Link>
            </div>
            <p className="mt-6 text-sm text-ink/60">Already a resident of Parkview Residency? <Link href="/login" className="font-semibold underline">Sign in to the app</Link></p>
          </div>
          <ComposerDemo />
        </div>
      </section>

      {/* H2 problem */}
      <section className="bg-bone py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="max-w-2xl text-4xl font-semibold text-tide md:text-5xl">Getting things done has become a job in itself.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-[1.2fr_1fr_1fr] md:items-start">
            {[["Trust", "Who is coming into my home? Most of the time you can only hope.", "-1.2deg", "md:mt-0"], ["Quality", "If it goes wrong, who is accountable? Usually nobody.", "1deg", "md:mt-10"], ["Juggling", "Four apps, four chats, four prices, and you are the project manager.", "-0.6deg", "md:mt-4"]].map(([t, d, r, m]) => (
              <article key={t} className={`bg-paper p-6 shadow-[0_10px_25px_-12px_rgba(5,31,32,.35)] transition-transform duration-300 hover:!rotate-0 hover:-translate-y-1 ${m}`} style={{ transform: `rotate(${r})`, borderTop: "6px solid #e8c48a" }}>
                <h3 className="text-3xl font-semibold text-tide">{t}</h3><p className="mt-3 text-ink/75">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* H3 pinned story */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <p className="washi">One message, one result</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold text-tide md:text-5xl">From a sentence to a finished home.</h2>
          <div className="mt-10"><PinnedStory /></div>
        </div>
      </section>

      {/* H4 four jobs one bill */}
      <section className="bg-forest py-20 text-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div><h2 className="text-4xl font-semibold md:text-5xl">Four jobs. One bill.</h2><p className="mt-4 text-sage">Flip the switch to see what changes when one team is accountable for everything.</p></div>
          <div className="rounded-3xl bg-bone p-6 text-ink"><FourJobs /></div>
        </div>
      </section>

      {/* H5 services */}
      <section className="bg-bone py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="text-4xl font-semibold text-tide md:text-5xl">Two ways to get help. One way to earn.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-6">
            <Link href="/services/managed" className="group relative overflow-hidden rounded-3xl bg-tide p-8 text-cream md:col-span-4 md:row-span-2">
              <span className="pill pill-warn">Most popular</span>
              <h3 className="mt-4 text-4xl font-semibold">Shell Managed</h3>
              <p className="mt-2 max-w-md text-sage">Events, moves and full home organising. We plan the day, coordinate several helpers, and deliver one finished result.</p>
              <ul className="mt-5 space-y-1 text-sm text-cream/90"><li>Guests tomorrow</li><li>Move-in clean and unpack</li><li>Festival preparation</li></ul>
              <div className="mt-8 flex items-center gap-2" aria-hidden>{["12h", "6h", "3h", "Guests"].map((x, i) => <div key={x} className="flex flex-1 flex-col items-center"><div className="h-2 w-full rounded-full" style={{ background: i === 3 ? "#f2c318" : "#235347" }} /><span className="mt-1 text-xs text-sage">{x}</span></div>)}</div>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold">Explore <Icon name="arrow" size={18} /></span>
            </Link>
            <Link href="/services/quick" className="rounded-3xl border border-line bg-white p-6 md:col-span-2" style={{ transform: "rotate(1deg)" }}>
              <div className="flex gap-2 text-euca"><Icon name="parcel" size={34} /><Icon name="bag" size={34} /></div>
              <h3 className="mt-3 text-2xl font-semibold text-tide">Shell Quick</h3><p className="mt-1 text-sm text-ink/70">Single small tasks, done fast.</p>
              <p className="mt-2 text-xs text-ink/50">Parcel pickup, groceries, dishes</p>
            </Link>
            <Link href="/earn" className="rounded-3xl bg-cream p-6 md:col-span-2" style={{ transform: "rotate(-1deg)" }}>
              <h3 className="text-2xl font-semibold text-tide">Shell Earn</h3><p className="mt-1 text-sm text-ink/70">Earn with your skills and your timetable.</p>
              <p className="mt-2 text-xs text-ink/50">For students and freelancers</p>
            </Link>
            <Link href="/services/routines" className="ticket p-6 md:col-span-6 lg:col-span-6">
              <div className="flex items-center justify-between gap-4"><div><h3 className="text-2xl font-semibold text-tide">Shell Routines</h3><p className="text-sm text-ink/70">Weekly cleaning, pet walks, regular errands. Same helper, same time.</p></div><span className="stamp stamp-red">Coming soon</span></div>
            </Link>
          </div>
        </div>
      </section>

      {/* H6 packs */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="flex items-end justify-between gap-4"><h2 className="text-4xl font-semibold text-tide md:text-5xl">Ready-made plans.</h2><Link href="/packs" className="hidden text-sm font-semibold underline sm:block">See all packs</Link></div>
          <div className="scroll-x -mx-5 mt-8 flex gap-5 px-5 pb-4 md:mx-0 md:px-0" tabIndex={0} aria-label="Packs">
            {packs.map((p) => {
              const est = packEstimate(p.items);
              return (
                <Link key={p.slug} href={`/packs/${p.slug}`} className="ticket w-72 shrink-0 p-6">
                  <p className="text-[0.7rem] font-bold tracking-[0.2em] text-euca">PACK</p>
                  <h3 className="text-2xl font-semibold leading-tight text-tide">{p.name}</h3>
                  <ul className="mt-3 space-y-1 text-sm text-ink/70">{p.items.slice(0, 3).map((i) => <li key={i.slug}>· {i.note}</li>)}</ul>
                  <hr className="perf" />
                  <div className="flex items-baseline justify-between"><span className="text-xs text-ink/60">From</span><span className="font-bold" style={{ fontFamily: "var(--font-mono)" }}>{formatINR(est.total)}</span></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* H7 guardian */}
      <section className="grain bg-tide py-20 text-cream">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 md:px-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="text-4xl font-semibold md:text-5xl">Shell Guardian.</h2>
            <p className="mt-3 max-w-md text-sage">Every job follows the same safe path, from the gate to your door.</p>
            <svg viewBox="0 0 520 190" className="mt-8 w-full" role="img" aria-label="Path from gate to tower to door"><g fill="none" stroke="#235347" strokeWidth="3" strokeLinecap="round"><path d="M30 130 C130 130 130 60 260 60 S400 130 490 90" strokeDasharray="2 9" /></g>
              <path className="draw-line" d="M30 130 C130 130 130 60 260 60 S400 130 490 90" fill="none" stroke="#f2c318" strokeWidth="4" strokeLinecap="round" style={{ animationDuration: "3s" }} />
              {[["Gate", 30, 130, "Pass sent"], ["Tower", 260, 60, "Door code"], ["Door", 490, 90, "Check-in"]].map(([n, x, y, s]) => <g key={n as string}><circle cx={x as number} cy={y as number} r="10" fill="#daf1de" /><text x={x as number} y={(y as number) + 30} textAnchor="middle" fill="#daf1de" fontSize="13" fontWeight="600">{n}</text><text x={x as number} y={(y as number) + 46} textAnchor="middle" fill="#8eb69b" fontSize="11">{s}</text></g>)}</svg>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {["Government ID verified", "College ID checked", "Door code to start every job", "Gate pass sent to the guard", "Live SOS, escalated in 20 seconds", "Payment held until you approve"].map((t, i) => (
              <li key={t} className="flex items-start gap-3 rounded-2xl border border-moss bg-forest p-4"><span className="stamp stamp-green !text-sage !border-sage">{i + 1}</span><span className="text-sm">{t}</span></li>
            ))}
          </ol>
        </div>
        <p className="mx-auto mt-10 max-w-6xl px-5 text-sm text-sage md:px-8">We don&apos;t take risky categories. Massage, makeup and personal care are not offered at launch.</p>
      </section>

      {/* H8 earn */}
      <section className="bg-bone py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:px-8 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl font-semibold text-tide md:text-5xl">Earn while you study. On your own timetable.</h2>
            <p className="mt-4 text-ink/70">Every job you complete adds a stamp to your Skill Passport, a verified record you can use for internships and applications.</p>
            <div className="mt-6 grid max-w-sm grid-cols-3 gap-3">{["house-cleaning", "wardrobe", "excel"].map((s, i) => <div key={s} className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-euca/40 text-euca" style={{ transform: `rotate(${[-4, 3, -2][i]}deg)` }}><Icon name={["broom", "hanger", "phone"][i]} size={34} /></div>)}</div>
            <Link href="/earn" className="btn btn-primary mt-8">Create your passport</Link>
          </div>
          <EarnCalculator />
        </div>
      </section>

      {/* H9 societies */}
      <section className="bg-forest py-20 text-cream">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="mb-8 text-4xl font-semibold md:text-5xl">Is Shell in your society yet?</h2>
          <SocietyFinder cells={cells} initial={initial} />
        </div>
      </section>

      {/* H10 numbers */}
      <section className="bg-bone py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-4 md:px-8">
          {nums.map((n) => (n.v > (n.min ?? 10) ? (
            <div key={n.l}><div className="serif text-5xl font-bold text-tide">{n.l === "average rating" ? n.v : n.v.toLocaleString("en-IN")}</div><div className="text-sm text-ink/60">{n.l}</div></div>
          ) : (
            <div key={n.l} className="text-2xl text-euca" style={{ fontFamily: "var(--font-hand)" }}>We&apos;re just starting. You could be one of the first {n.l.split(" ")[0] === "verified" ? "helpers" : n.l.split(" ")[0] === "jobs" ? "to book" : "neighbours"}.</div>
          )))}
        </div>
      </section>

      {/* H11 FAQ */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-[0.7fr_1.3fr]">
          <h2 className="sticky-top self-start text-4xl font-semibold text-tide md:text-5xl">Questions, answered plainly.</h2>
          <div className="divide-y divide-line border-y border-line">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-4"><summary className="flex items-center justify-between gap-4 text-lg font-semibold text-tide">{f.q}<span className="plus text-2xl text-euca transition-transform">+</span></summary><p className="mt-2 max-w-2xl text-ink/75">{f.a}</p></details>
            ))}
          </div>
        </div>
      </section>

      {/* H12 final CTA */}
      <section className="bg-cream py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div><h2 className="text-4xl font-semibold text-tide md:text-5xl">Be one of the first neighbours in.</h2><p className="mt-4 max-w-md text-ink/70">The more neighbours who sign up, the sooner we open your society. Invite a few and move up the list.</p></div>
          <WaitlistForm societies={socs.map((s) => s.n)} />
        </div>
      </section>
    </>
  );
}
