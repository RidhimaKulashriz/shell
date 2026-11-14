import Link from "next/link";
import { PageHero, Section, H2 } from "@/components/Page";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "About Shell: why we exist and how we make money", description: "Why Shell exists, what we believe, how we earn in plain words, and our roadmap from one Delhi society outwards.", path: "/about" });

const ROAD = [["Now", "One society in Delhi. Waitlist, plans reviewed by people."], ["Next", "First tower live. Guardian, Circles and the Expense Wallet."], ["Then", "Whole society, Routines, Shell Plus."], ["Later", "Nearby societies, hostels and offices."]];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Hamari kahani" title={<>Kaam karwana khud ek <span className="font-accent text-euca">kaam</span> kyun hai?</>} sub="Hum ek society mein rehte the. Ghar mein mehmaan aate the, aur hafta ek WhatsApp group se doosre tak bhaagte guzarta tha." />
      <Section tone="paper">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4 text-lg leading-relaxed">
            <p>Ek bar ek party se pehle humne chaar log bulaye: safai, groceries, decoration, aur ek helper jo sab dekhe. Do aaye, ek late, ek nahi. Kaam hua, par thakaan us kaam se zyada thi.</p>
            <p>Dusri taraf, humare aas-paas ke college students ke paas time, skills aur kamai ki zarurat thi. Bas koi bharosemand tareeka nahi tha.</p>
            <p>Shell isi beech ka pul hai. Hum helper dhoondhne mein madad nahi karte. Hum kaam poora karne ki zimmedari lete hain.</p>
            <p className="hand text-3xl text-euca">- Founders, Shell</p>
          </div>
          <div className="rounded-3xl bg-sand p-6 ring-2 ring-tide" style={{ transform: "rotate(1deg)" }}>
            <h2 className="font-display text-3xl font-bold">Hum kaise kamate hain</h2>
            <ul className="mt-3 space-y-2">{["Har job par ek commission", "Platform fee (kam se kam ₹29)", "3+ kaam wale plans par coordination fee", "Baad mein: Shell Plus subscription", "Baad mein: societies, hostels aur offices ke liye B2B"].map((x) => <li key={x}>· {x}</li>)}</ul>
            <p className="mt-3 text-sm">Sab receipt mein dikhta hai. Koi hidden charge nahi.</p>
          </div>
        </div>
      </Section>
      <Section tone="dark">
        <H2>Hum kya maante hain</H2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[["Comfort", "Peeche hatiye, apna time wapas lijiye."], ["Connection", "Koi kaabil insaan aapke paas hi hai."], ["Opportunity", "Jiske paas bhi kaam ka skill hai, wo kama sakta hai."]].map(([t, d], i) => <div key={t} className="rounded-3xl bg-moss p-6" style={{ transform: `rotate(${[-1, 0.7, -0.5][i]}deg)` }}><p className="font-display text-4xl font-bold">{t}</p><p className="mt-2 text-cream/85">{d}</p></div>)}
        </div>
      </Section>
      <Section tone="cream">
        <H2>Raasta</H2>
        <div className="relative mt-10">
          <svg viewBox="0 0 800 60" className="absolute left-0 top-3 hidden w-full md:block" aria-hidden="true"><path d="M10 30 C120 5 220 55 330 30 S540 5 640 30 S760 45 790 30" fill="none" stroke="#235347" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" /></svg>
          <ol className="relative grid gap-6 md:grid-cols-4">{ROAD.map(([t, d], i) => <li key={t} className="pt-10"><span className="absolute top-0 h-6 w-6 rounded-full bg-sun ring-4 ring-cream" style={{ left: `${i * 25 + 2}%` }} aria-hidden="true" /><p className="font-display text-2xl font-bold">{t}</p><p>{d}</p></li>)}</ol>
        </div>
        <Link href="/waitlist" className="pill pill-sun mt-8">Join the waitlist</Link>
      </Section>
    </>
  );
}
