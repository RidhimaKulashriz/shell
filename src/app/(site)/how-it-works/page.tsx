import { Hero, Section, H2, Cta } from "@/components/page";
import { Receipt } from "@/components/ui";
import { Icon } from "@/components/icons";
export const metadata = { title: "How it works", description: "Tell us, we plan, verified helpers come, and we handle it until it's done." };
const steps = [
  ["Tell us", "mic", "Type, speak or send a photo. Write it the way you'd tell a friend. We ask at most three short questions, answered with a tap."],
  ["We plan", "receipt", "You get one plan: every task, the time it takes and the price. A person on our team checks it first, so it makes sense before you see it."],
  ["Verified helpers", "shield", "We choose helpers for each task by skill, distance, rating and your preferences. You see who is coming and why we picked them."],
  ["We handle it till done", "check", "Track progress live, chat in the app, approve the photos. If anything is off, we fix it within 24 hours."],
];
export default function Page() {
  return (
    <>
      <Hero eyebrow="How it works" title="Four steps, and you don't have to manage any of them." lead="Shell takes responsibility for the result. Here's what happens between your message and a finished home." />
      <Section tone="white"><div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">{steps.map(([t, i], n) => <a key={t} href={`#s${n}`} className="bg-white p-5 hover:bg-cream"><span className="serif text-4xl font-bold text-sage">{n + 1}</span><div className="mt-2 flex items-center gap-2 font-semibold"><Icon name={i} size={20} className="text-euca" />{t}</div></a>)}</div></Section>
      {steps.map(([t, i, d], n) => (
        <Section key={t} tone={n % 2 ? "cream" : "bone"}>
          <div id={`s${n}`} className={`grid items-center gap-10 md:grid-cols-2 ${n % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
            <div><span className="pill">Step {n + 1}</span><H2 className="mt-3 text-tide">{t}</H2><p className="mt-4 text-lg text-ink/75">{d}</p>
              {n === 1 && <ul className="mt-4 space-y-1 text-ink/75"><li>Prices = task time × rate + travel + fees.</li><li>Fees show as separate lines. No hidden charges.</li><li>Price is a range until you approve, then it&apos;s exact.</li></ul>}
              {n === 3 && <ul className="mt-4 space-y-1 text-ink/75"><li>Door code to start every job.</li><li>Request changes. You see the price before you accept.</li><li>Free rework within 24 hours.</li></ul>}</div>
            {n === 1 ? <Receipt title="Guests tomorrow" lines={[{ name: "Groceries", detail: "1 trip · 1h", amount: "₹149", stamped: true }, { name: "House cleaning", detail: "4 rooms · 3h", amount: "₹1,000", stamped: true }]} fees={[{ label: "Platform fee", amount: "₹92" }]} total="₹1,241" status="APPROVED" />
              : <div className="grid aspect-[4/3] place-items-center rounded-3xl bg-tide text-sage"><Icon name={i} size={90} /></div>}
          </div>
        </Section>
      ))}
      <Section tone="tide"><H2>What if something goes wrong?</H2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">{[["Helper is late", "We alert you at 10 minutes and send a backup helper automatically. You get a credit."], ["Quality issue", "Free rework within 24 hours. If it still isn't right, a person reviews a refund."], ["Damage", "Shell damage cover applies. Report it with photos and we respond within 24 hours."], ["Safety concern", "Press SOS. Our team and the society guard are alerted within 20 seconds."]].map(([a, b]) => <div key={a} className="rounded-2xl border border-moss bg-forest p-5"><h3 className="text-xl font-semibold">{a}</h3><p className="mt-2 text-sm text-sage">{b}</p></div>)}</div></Section>
      <Section><div className="flex flex-wrap items-center justify-between gap-4"><H2 className="text-tide">See it for your home.</H2><Cta /></div></Section>
    </>
  );
}
