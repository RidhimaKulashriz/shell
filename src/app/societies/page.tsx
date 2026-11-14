import { PageHero, Section, H2 } from "@/components/Page";
import { EnquiryForm } from "@/components/EnquiryForm";
import { WaitlistMap } from "@/components/WaitlistMap";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Shell for societies and RWAs", description: "Verified helpers, a gate-pass system, fewer unknown faces at the gate and a revenue share for the society fund.", path: "/societies" });

const ANNOUNCE = `Dear residents,

Our society is joining Shell, a service where verified helpers (ID and college ID checked) do household tasks. Every visit comes with a gate pass QR for the guard and a door OTP for you. Sign up at the link below, and help us open Shell in our towers sooner.

Regards,
Managing Committee`;

export default function Page() {
  return (
    <>
      <PageHero tone="dark" eyebrow="RWA ke liye" title={<>Gate par <span className="font-accent text-sun">kam</span> anjaan chehre.</>} sub="Shell helpers verified hote hain, gate pass guard ko pehle hi mil jata hai, aur society ko revenue share ka hissa fund mein jata hai." />
      <Section tone="paper">
        <div className="grid gap-6 md:grid-cols-3">
          {[["Verified helpers", "ID, college ID aur selfie check. Aapki society ka roster aap dekh sakte ho."], ["Gate-pass system", "Har visit ka QR guard ke phone par, tower aur time ke saath."], ["Society fund", "Har job ka ek chhota hissa society fund mein, jo RWA ke vote se use hota hai."]].map(([t, d], i) => <div key={t} className="rounded-3xl bg-cream p-6 ring-2 ring-tide" style={{ transform: `rotate(${[-1, 0.8, -0.5][i]}deg)` }}><p className="font-display text-3xl font-bold">{t}</p><p className="mt-2">{d}</p></div>)}
        </div>
      </Section>
      <Section tone="cream">
        <H2>Onboarding, 4 step</H2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">{["RWA se baat aur form", "Guard briefing, gate pass test", "Residents ka waitlist aur verification", "Pilot ek tower se, phir poori society"].map((s, i) => <li key={s} className="rounded-2xl border-2 border-dashed border-tide/50 p-5"><span className="font-mono text-sm">0{i + 1}</span><p className="mt-1 text-lg">{s}</p></li>)}</ol>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-display text-3xl font-bold">Guard ka kaam</h3>
            <p className="mt-2">Guard ke phone par: helper ka naam aur photo, tower, kitne baje tak, aur QR scan karne par &lsquo;allowed&rsquo;. Check-in aur check-out ka time apne aap record hota hai.</p>
            <h3 className="font-display mt-6 text-3xl font-bold">Residents ko bhejne ka message</h3>
            <pre className="receipt mt-3 whitespace-pre-wrap p-4 text-xs leading-relaxed">{ANNOUNCE}</pre>
            <p className="mt-3 text-sm">One-page PDF for the committee: on request from the form, we will send it on WhatsApp.</p>
          </div>
          <EnquiryForm kind="rwa" />
        </div>
      </Section>
      <Section tone="dark"><H2 className="mb-8">Live waitlist</H2><WaitlistMap search /></Section>
    </>
  );
}
