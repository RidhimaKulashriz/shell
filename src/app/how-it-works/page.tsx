import Link from "next/link";
import { PageHero, Section, H2 } from "@/components/Page";
import { Icon } from "@/components/Icon";
import { Receipt, Reveal, Stamp } from "@/components/ui";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({
  title: "How Shell works: tell us, we plan, verified helpers, done",
  description: "Four steps from one message to a finished job. See how Shell plans, prices, assigns verified helpers and handles problems.",
  path: "/how-it-works",
});

const STEPS = [
  { n: "01", t: "Tell us", i: "chat" },
  { n: "02", t: "We plan", i: "calendar" },
  { n: "03", t: "Verified helpers", i: "shield" },
  { n: "04", t: "We handle it till done", i: "check" },
];

const WRONG = [
  { t: "Helper is late", w: "Alert at 10 minutes", d: "You get a message with the reason. At 10 minutes past, a backup helper is triggered and you get a credit.", i: "clock" },
  { t: "Quality issue", w: "Rework within 24 hours", d: "Tap the checklist items that missed. A helper returns, free. Still unhappy, open a dispute and we reply in 24 hours.", i: "broom" },
  { t: "Damage", w: "Cover up to the stated limit", d: "Photos at check-in and check-out are the evidence. Shell Guarantee covers damage caused by a helper. Ops calls you the same day.", i: "box" },
  { t: "Safety concern", w: "SOS wakes ops in 20 seconds", d: "Press and hold the SOS button, or shake. Ops and the society guard are alerted, and your trusted contact gets a live link.", i: "shield" },
];

const SAMPLE = [
  ["Wed 9:02 pm", "Meera writes: 'Kal guests aa rahe hain...' with a photo of the wardrobe."],
  ["Wed 9:04 pm", "Two chip questions: kitne guests, kitne kamre."],
  ["Wed 9:17 pm", "A human checks the plan. Receipt sent: 4 tasks, ₹2,180."],
  ["Wed 9:20 pm", "Meera approves. PAID stamp. Money held."],
  ["Thu 8:30 am", "Rahul buys groceries inside a ₹1,500 cap. Receipt photo is itemised."],
  ["Thu 11:00 am", "Cleaning starts after Door OTP. Check-in photos."],
  ["Thu 4:20 pm", "Wardrobe done. Before and after in the Time Machine slider."],
  ["Thu 6:45 pm", "Decoration finished. Ring hits 100%."],
  ["Thu 7:10 pm", "Meera approves, rates 5 stars, sends a Shell Note. Payment released."],
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Chaar step, bas" title={<>Ek message se <span className="font-accent text-euca">ready</span> ghar tak.</>} sub="Aap likhte ho. Hum plan banate hain, helpers bhejte hain, aur kaam khatam hone tak saath rehte hain.">
        <ol className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-3 md:mx-0 md:px-0">
          {STEPS.map((s, i) => (
            <li key={s.n} className="relative shrink-0 snap-start">
              <a href={`#step-${i + 1}`} className="flex w-56 items-center gap-3 rounded-full bg-paper py-3 pl-3 pr-6 ring-2 ring-tide" style={{ transform: `rotate(${[-1, 1, -0.6, 0.8][i]}deg)` }}>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-sand"><Icon name={s.i} size={30} /></span>
                <span><span className="block font-mono text-xs">{s.n}</span><span className="font-display text-lg font-bold leading-tight">{s.t}</span></span>
              </a>
            </li>
          ))}
        </ol>
      </PageHero>

      <Section tone="paper" id="step-1">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <p className="font-mono text-sm">01</p>
            <H2>Tell us. Kisi bhi bhasha mein.</H2>
            <p className="mt-4 text-lg">Type karo, boliye, ya ek photo daalo. Hindi, English, Hinglish, sab chalega. Hum sirf wahi poochhte hain jo plan ke liye chahiye: kitne kamre, kitne guests, koi allergy, kab tak chahiye.</p>
            <ul className="mt-5 space-y-2">
              {["Text: ek sentence kaafi hai", "Voice: 60 second tak, transcript edit kar sakte ho", "Photo: kamre ki photo, hum problem jagah par circle lagate hain", "Zyada se zyada paanch sawaal, 'skip, aap decide karo' hamesha"].map((x) => <li key={x} className="flex gap-3"><Icon name="check" size={24} /> {x}</li>)}
            </ul>
          </div>
          <Reveal rot={1.5}>
            <div className="bg-cream rounded-[28px] p-5 ring-2 ring-tide">
              <p className="font-mono text-[11px] uppercase tracking-widest text-euca">Tell Shell</p>
              <p className="mt-2 rounded-2xl border-2 border-dashed border-tide/40 bg-white/60 p-3">Weekend pe ghar saaf, wardrobe set, aur kuch groceries chahiye</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold"><span className="rounded-full bg-sand px-3 py-1">Kitne kamre? 3</span><span className="rounded-full bg-sage/60 px-3 py-1">Kab tak? Shanivar</span></div>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section tone="dark" id="step-2">
        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
          <Reveal rot={-1.5} className="order-2 md:order-1">
            <Receipt title="YOUR PLAN" lines={[
              { label: "Cleaning x3", sub: "3 hrs · Sat 10 am", amount: "₹480", stamped: true },
              { label: "Wardrobe", sub: "2 hrs · Sat 2 pm", amount: "₹520", stamped: true },
              { label: "Groceries", sub: "cap ₹1,500", amount: "₹280", stamped: true },
              { label: "Platform fee", sub: "max(₹29, 8%)", amount: "₹103" },
              { label: "Coordination fee", sub: "3+ tasks", amount: "₹49" },
            ]} total="₹1,432" foot="Includes Shell Guarantee." stamp={<Stamp thump>APPROVED</Stamp>} />
          </Reveal>
          <div className="order-1 md:order-2">
            <p className="font-mono text-sm text-sage">02</p>
            <H2>We plan. Insaan check karta hai.</H2>
            <p className="mt-4 text-lg text-cream/85">Plan ek receipt hai. Har line ek kaam: time, price, helper. Price hamesha hamare pricing engine se aata hai: kaam ka time × rate + fee. Koi bhi plan customer tak jaane se pehle ek insaan dekhta hai (15 minute ke andar, working hours mein).</p>
            <p className="mt-3 text-cream/85">Aap quantity badal sakte ho, kaam hata sakte ho, ya time aage-peeche kar sakte ho. Receipt turant badalti hai.</p>
            <Link href="/pricing" className="mt-5 inline-block font-semibold text-sun underline decoration-wavy underline-offset-4">Price kaise bante hain →</Link>
          </div>
        </div>
      </Section>

      <Section tone="cream" id="step-3">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="font-mono text-sm">03</p>
            <H2>Verified helpers. Naam ke saath.</H2>
            <p className="mt-4 text-lg">Hum helper ko skill, society ke paas hone, availability, rating, aur time par aane ke record se chunte hain. Aap pehle hi unka card dekhte ho: photo, first name, level, languages, 20 second ki voice intro, aur &lsquo;hum Rahul ko kyun laaye&rsquo;.</p>
            <ul className="mt-5 grid gap-2 text-[0.97rem]">
              {["18+ date of birth check", "Government ID via KYC provider (no Aadhaar number stored)", "College ID, both sides", "Selfie liveness matched to ID", "Safety training pass mark 80%", "First job shadowed for Managed work"].map((x, i) => <li key={x} className="flex gap-3 rounded-xl bg-white/60 px-3 py-2"><span className="font-mono">{i + 1}</span>{x}</li>)}
            </ul>
          </div>
          <Reveal rot={2}>
            <div className="bg-paper mx-auto max-w-sm rounded-[24px_30px_22px_28px] p-5 shadow-[0_14px_0_rgba(5,31,32,0.15)] ring-2 ring-tide">
              <div className="flex items-center gap-4"><span className="grid h-20 w-20 place-items-center rounded-2xl bg-sage/60 font-display text-4xl font-bold">R</span><div><p className="font-display text-2xl font-bold">Rahul</p><p className="font-mono text-xs">TRUSTED · 4.8 · 31 jobs</p><p className="text-xs">Hindi · English · Punjabi</p></div></div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-sand px-2 py-1">Cleaning</span><span className="rounded-full bg-sand px-2 py-1">Groceries</span><span className="rounded-full bg-sand px-2 py-1">Careful with wardrobes</span></div>
              <p className="hand mt-3 text-xl leading-tight">Rahul Tower C ke paas rehta hai, aur aapke wardrobe jaise 6 jobs kar chuka hai.</p>
              <div className="mt-2 flex gap-2"><Stamp tone="green" className="!text-[10px]">ID</Stamp><Stamp tone="green" className="!text-[10px]">COLLEGE</Stamp><Stamp tone="green" className="!text-[10px]">SAFETY</Stamp></div>
              <p className="mt-2 font-mono text-[10px] opacity-60">Sample card.</p>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section tone="paper" id="step-4">
        <p className="font-mono text-sm">04</p>
        <H2 className="max-w-3xl">We handle it till done.</H2>
        <div className="mt-8 grid gap-5 md:grid-cols-4">
          {[
            ["Live tracker", "Gate se tower, lift ke saath ETA. Door OTP sirf helper ko.", "map"],
            ["Changes", "Extra time ya extra kaam? Price delta dikhta hai, aap haan ya na bolte ho.", "calendar"],
            ["Guarantee", "Rework 24 ghante mein, free. Damage cover bhi.", "shield"],
            ["Proof", "Before-after photos ek slider mein. Approve karo to payment chhutti.", "camera"],
          ].map(([t, d, ic], i) => (
            <Reveal key={t} rot={[-1.2, 1, -0.6, 1.4][i]} delay={i * 80}>
              <div className="h-full rounded-3xl bg-cream p-5 ring-2 ring-tide"><Icon name={ic} size={40} /><p className="font-display mt-2 text-2xl font-bold">{t}</p><p className="mt-1 text-sm">{d}</p></div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="tide">
        <H2>Agar kuch galat ho jaye?</H2>
        <p className="mt-2 max-w-xl text-cream/80">Chaar raaste, chaar jawab. Time ke saath.</p>
        <div className="relative mt-10 grid gap-4 md:grid-cols-4">
          <div className="absolute left-0 right-0 top-6 hidden border-t-2 border-dashed border-sage/50 md:block" aria-hidden="true" />
          {WRONG.map((w, i) => (
            <div key={w.t} className="relative rounded-3xl bg-forest p-5 pt-10 ring-1 ring-sage/40">
              <span className="absolute left-5 top-0 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-sand text-tide"><Icon name={w.i} size={28} spot={false} /></span>
              <p className="font-display text-2xl font-bold">{w.t}</p>
              <p className="font-mono text-xs uppercase tracking-wider text-sun">{w.w}</p>
              <p className="mt-2 text-sm text-cream/80">{w.d}</p>
              <span className="sr-only">Branch {i + 1} of 4</span>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="cream">
        <H2>Ek poora job, message se review tak</H2>
        <ol className="relative mt-10 max-w-3xl border-l-4 border-dotted border-tide/40 pl-8">
          {SAMPLE.map(([t, d], i) => (
            <Reveal as="li" key={t + i} className="relative mb-6">
              <span className="absolute -left-[2.55rem] top-1 h-4 w-4 rounded-full bg-sun ring-4 ring-cream" aria-hidden="true" />
              <p className="font-mono text-xs uppercase tracking-widest text-euca">{t}</p>
              <p className="text-lg">{d}</p>
            </Reveal>
          ))}
        </ol>
        <Link href="/waitlist" className="pill pill-sun mt-6" data-cta="how_waitlist">Join the waitlist</Link>
      </Section>
    </>
  );
}
