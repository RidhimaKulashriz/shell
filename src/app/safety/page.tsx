import Link from "next/link";
import { PageHero, Section, H2 } from "@/components/Page";
import { GuardianPath, Promises } from "@/components/home/Guardian";
import { Icon } from "@/components/Icon";
import { FaqList } from "@/components/Faq";
import { CONTACT, buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Safety and trust at Shell", description: "How Shell verifies helpers, protects your door with OTP and gate pass, and responds to SOS in 20 seconds.", path: "/safety" });

const FUNNEL = ["Applied", "ID checked", "College ID checked", "Selfie liveness", "Training passed", "First job shadowed"];
const NEVER = [
  ["Massage, makeup, personal care", "Too close, too risky, too easy to get wrong."],
  ["Doing homework", "We explain and tutor. The student writes the answers."],
  ["Helpers under 18", "Date of birth is hard-blocked at 18."],
  ["Phone numbers and UPI IDs in chat", "Messages blur. Off-platform deals earn a strike."],
  ["Cameras inside your home", "Ghost Jobs use timestamped photos of the checklist, not cameras."],
  ["Keeping your keys", "Keys stay with you, the guard or an OTP lockbox."],
];
const FAQ = [
  { q: "What if the helper never comes?", a: "We re-assign after 10 minutes, add a credit, and refund in full if no backup is available." },
  { q: "What does damage cover include?", a: "Damage caused by a helper during a job, up to the stated limit, assessed with check-in and check-out photos." },
  { q: "How do disputes work?", a: "Pick a reason, add evidence. We reply in 24 hours, resolve with redo, refund or credit, and you can appeal once." },
];

export default function Page() {
  return (
    <>
      <PageHero tone="dark" eyebrow="Pehle bharosa" title={<>Aapka ghar. Aapki <span className="font-accent text-sun">marzi</span>.</>} sub="Shell mein koi bhi aapke ghar tak tab pahunchta hai jab uska ID, college ID aur selfie check ho chuke hon, aur aapke paas ek code ho jo sirf wo hi use kar sake." />
      <Section tone="paper">
        <H2>Verification funnel</H2>
        <p className="mt-2 max-w-xl">Har helper in chhe padaav se guzarta hai. Real pass-through rates tab dikhayenge jab data hoga.</p>
        <ol className="mt-8 space-y-2">
          {FUNNEL.map((f, i) => (
            <li key={f} className="flex items-center gap-3">
              <span className="font-mono text-sm">{i + 1}</span>
              <div className="flex-1 rounded-r-full bg-euca py-3 pl-5 text-cream" style={{ width: `${100 - i * 11}%` }}>{f}</div>
            </li>
          ))}
        </ol>
      </Section>
      <Section tone="tide">
        <H2>Guardian: gate se door tak</H2>
        <div className="mt-8 grid gap-10 md:grid-cols-2"><GuardianPath /><Promises /></div>
      </Section>
      <Section tone="cream">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <H2>Female helper option</H2>
            <p className="mt-4 text-lg">Home Atlas mein &lsquo;female helper only&rsquo; on karo. Hum sirf women helpers ko match karte hain. Supply abhi chhoti hai, isliye kabhi kabhi time thoda aage-peeche ho sakta hai, aur hum pehle bata dete hain.</p>
            <H2 className="mt-10 !text-4xl md:!text-5xl">Data aur privacy</H2>
            <ul className="mt-4 space-y-2">
              {["Aadhaar number kabhi store nahi hota", "Location sirf job ke dauraan, aapki consent ke saath", "Location 30 din mein delete, staff access ka log", "Account delete: 7 din cooling period, phir sab saaf"].map((x) => <li key={x} className="flex gap-3"><Icon name="check" size={24} />{x}</li>)}
            </ul>
          </div>
          <div>
            <H2>Jo hum kabhi nahi karte</H2>
            <ul className="mt-4 space-y-3">
              {NEVER.map(([t, d], i) => <li key={t} className="rounded-2xl bg-paper p-4 ring-2 ring-tide" style={{ transform: `rotate(${[-0.6, 0.5][i % 2]}deg)` }}><p className="font-display text-xl font-bold">{t}</p><p className="text-sm">{d}</p></li>)}
            </ul>
          </div>
        </div>
      </Section>
      <Section tone="dark">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <H2>Koi chinta ho?</H2>
            <p className="mt-3 text-cream/85">24x7 safety line: <a className="font-mono text-sun underline" href={`tel:${CONTACT.safetyLine.replace(/\s/g, "")}`}>{CONTACT.safetyLine}</a></p>
            <p className="mt-2 text-cream/85">App mein SOS dabao, ya <Link className="underline" href="/contact">report a concern</Link>.</p>
            <p className="hand mt-6 text-3xl text-sand">Kuch bhi galat lage to SOS dabao. Hum 20 second mein jaag jaate hain.</p>
          </div>
          <FaqList items={FAQ} tone="dark" />
        </div>
      </Section>
    </>
  );
}
