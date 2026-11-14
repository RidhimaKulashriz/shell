import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHero, Section } from "@/components/site/Bits";
import { Receipt, Stamp } from "@/components/ui";
import { meta } from "@/lib/seo";
import { getLang, pick } from "@/lib/lang";

export const metadata = meta({ title: "How Shell works", description: "Tell us, we plan, verified helpers come, and we handle it till done. A full sample plan from first message to review.", path: "/how-it-works" });

const STEPS = [
  { n: "01", t: "Tell us", icon: "chat", d: "Write, speak or send a photo. English or Hindi." },
  { n: "02", t: "We plan", icon: "calendar", d: "A person checks the plan and the price before you see it." },
  { n: "03", t: "Verified helpers", icon: "shield", d: "ID checked, trained, and matched to your task." },
  { n: "04", t: "We handle it till done", icon: "home", d: "Tracking, changes, guarantee. You approve at the end." },
];
const FAILS = [
  ["Helper is late", "Within 10 minutes we alert you with a reason, then send the backup helper. You get a credit if the delay passes 10 minutes.", "10 min"],
  ["Quality issue", "Tap Rework within 24 hours. We send someone back at no cost. Still not right? We refund the affected part.", "24 hours"],
  ["Damage", "Photos and the job timeline are the evidence. The Shell Guarantee covers damage up to a set limit.", "48 hours"],
  ["Safety concern", "Press SOS. Our team and your trusted contact are alerted. The guard is informed. Helper is pulled from the job.", "20 seconds"],
];

export default async function Page() {
  const lang = await getLang();
  return (
    <>
      <PageHero eyebrow={pick(lang, "four steps", "चार कदम")} title={pick(lang, "How it", "काम कैसे")} em={pick(lang, "works.", "होता है।")} sub="From the first message to a finished home. No hunting for people, no chasing for updates.">
        <div className="hide-scroll flex gap-4 overflow-x-auto pb-4">
          {STEPS.map((s, i) => (
            <a key={s.n} href={`#s${i + 1}`} className="flex min-w-[250px] items-center gap-3 rounded-2xl border border-ink/20 bg-paper p-4" style={{ transform: `rotate(${[-1, 1, -0.6, 1.2][i]}deg)` }}>
              <span className="mono text-3xl text-euc">{s.n}</span><Icon name={s.icon} size={40} /><span><b className="display block text-xl">{s.t}</b><span className="text-sm">{s.d}</span></span>
            </a>
          ))}
        </div>
      </PageHero>

      <Section tone="paper" id="s1">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div><span className="mono text-sm text-euc">STEP 01</span><h2 className="display text-4xl md:text-5xl">Tell us</h2>
            <p className="mt-4 text-lg">One message is enough. &ldquo;Guests are coming tomorrow. I need the house cleaned and groceries bought.&rdquo; You can type, hold to record 60 seconds of voice, or upload up to five photos of the room.</p>
            <p className="mt-3 text-lg">We then ask at most five short questions, one at a time, answered with chips: how many BHK, any allergies, what spending cap, how the helper gets in. There is always a &lsquo;skip, you decide&rsquo; option.</p></div>
          <div className="note rotate-2"><p className="hand text-3xl">&ldquo;Guests are coming tomorrow...&rdquo;</p><p className="mt-3 text-sm">Text, voice or photo. We read English and Hindi.</p></div>
        </div>
      </Section>

      <Section tone="dark" id="s2">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Receipt title="Guests Are Coming" meta="Sample plan" lines={[{ name: "Groceries run", price: "₹179", stamp: true, sub: "T-24h, 1 hour, receipt checked line by line" }, { name: "Full home clean", price: "₹1,299", stamp: true, sub: "T-12h, about 4 hours" }, { name: "Wardrobe organising", price: "₹799", stamp: true, sub: "T-6h, 2 hours" }, { name: "Party decoration", price: "₹999", stamp: true, sub: "T-3h, 2 hours" }]} fees={[{ name: "Platform fee", price: "₹194" }, { name: "Coordination fee", price: "₹79" }]} total="₹3,549" paid className="text-ink" footer="Sample for illustration. Real prices come from the pricing engine." />
          <div><span className="mono text-sm text-sand">STEP 02</span><h2 className="display text-4xl md:text-5xl">We plan</h2>
            <p className="mt-4 text-lg">The receipt is your plan. Each line is one task: what, how long, how much. Prices come from a pricing engine, task time x rate, plus a platform fee and, on bigger plans, a coordination fee. No model sets a price.</p>
            <p className="mt-3 text-lg">A human checks every plan before you see it, within 15 minutes during working hours. We draft it, a person fixes it, you approve it. When you approve and pay, a PAID stamp thumps down and each line gets its own stamp as the helper finishes it.</p></div>
        </div>
      </Section>

      <Section tone="cream" id="s3">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div><span className="mono text-sm text-euc">STEP 03</span><h2 className="display text-4xl md:text-5xl">Verified helpers</h2>
            <p className="mt-4 text-lg">Every helper is 18 or older, has a government ID checked through a KYC partner, a college ID or proof of work, a selfie liveness check, safety training and a shadow job. We pick by skill, distance inside the society, rating, on-time record and whether you have worked together before.</p>
            <p className="mt-3 text-lg">You see a Meet Your Helper card: a 20 second intro, languages, what they are good at, verification badges, and a plain-language reason why we picked them.</p><div className="mt-5"><Link href="/safety" className="btn btn-forest">Safety and trust</Link></div></div>
          <div className="paper rotate-[-1.5deg] rounded-2xl border border-ink/20 p-6 shadow-[0_22px_44px_-30px_rgba(5,31,32,0.6)]"><div className="flex gap-4"><span className="grid h-20 w-20 place-items-center rounded-2xl border border-ink/20 bg-sand text-4xl display">R</span><div><b className="display text-2xl">Rahul</b><div className="mono text-sm">PRO · 4.9 · 74 jobs</div><div className="mt-1 flex gap-1 flex-wrap"><Stamp label="ID" /><Stamp label="College" rot={-3} /><Stamp label="Safety" rot={4} /></div></div></div><p className="mt-4 text-sm">&ldquo;Hi, I'm Rahul. I study at DTU.&rdquo;</p><p className="mt-3 rounded-xl bg-cream p-3 text-sm"><b>Why Rahul:</b> you have worked together before, about 4 min away, rated 4.9.</p></div>
        </div>
      </Section>

      <Section tone="paper" id="s4">
        <span className="mono text-sm text-euc">STEP 04</span><h2 className="display text-4xl md:text-5xl">We handle it till done</h2>
        <p className="mt-4 max-w-3xl text-lg">Live tracker with the Readiness Ring, helper ETA to your tower and floor, chat with translation, masked calls, a door OTP only you can see, change requests with the price shown before you agree, and photos with timestamps. At the end, a before-and-after slider and one button: &lsquo;Approve&rsquo; or &lsquo;Request rework&rsquo;.</p>
      </Section>

      <Section tone="dark">
        <h2 className="display text-4xl md:text-5xl">What if something <span className="serif-i">goes wrong?</span></h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {FAILS.map(([t, d, sla], i) => (
            <div key={t} className="relative rounded-xl border border-sage/60 p-5" style={{ transform: `rotate(${[-0.8, 0.6, 0.5, -0.5][i]}deg)` }}>
              <div className="flex items-center justify-between"><h3 className="display text-2xl">{t}</h3><span className="stamp">{sla}</span></div>
              <p className="mt-2 text-cream/90">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="cream">
        <h2 className="display text-4xl md:text-5xl">One full <span className="serif-i">job.</span></h2>
        <ol className="mt-10 max-w-2xl space-y-6 border-l border-dashed border-ink/40 pl-6">
          {[["Thu 6:02 pm", "Ananya writes: guests tomorrow, four things to do."], ["6:04 pm", "Two chip questions: 3 BHK, groceries cap Rs 3,000."], ["6:19 pm", "A person checks the plan. Receipt sent. Ready by 5 pm tomorrow."], ["6:22 pm", "Approved and paid. PAID stamp. Funds held."], ["Fri 9:00 am", "Sneha buys groceries. Receipt uploaded, Ananya approves lines. Unused Rs 860 refunded."], ["11:00 am", "Rahul checks in with the door OTP and cleans. Before and after photos."], ["3:00 pm", "Isha organises the wardrobe. Priya decorates."], ["4:40 pm", "All four lines stamped. Ring at 100%. Ananya taps 'Approve', rates 5, sends a Shell Note."]].map(([t, d]) => (
            <li key={t} className="relative"><span className="absolute -left-[33px] top-1.5 h-3 w-3 rounded-full border border-ink/20 bg-sun" /><span className="mono text-sm text-euc">{t}</span><p>{d}</p></li>
          ))}
        </ol>
      </Section>
    </>
  );
}
