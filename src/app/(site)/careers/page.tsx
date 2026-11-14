import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHero, Section } from "@/components/site/Bits";
import { Pill } from "@/components/ui";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Careers at Shell", description: "Open roles at Shell and a call to be one of our first 20 helpers.", path: "/careers" });

export default function Page() {
  return (
    <>
      <PageHero eyebrow="humare saath kaam karo" title="Pehle" em="bees helpers." sub="We are looking for the first 20 helpers in the pilot society. Students and freelancers welcome."><Pill href="/earn/apply" variant="sun">Helper ban jao</Pill></PageHero>
      <Section tone="paper">
        <h2 className="display text-3xl">Open roles</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{[["Ops associate, Delhi", "Review plans, run dispatch, talk to neighbours. Hinglish required."], ["Community lead, pilot society", "Be the face of Shell with the RWA, guards and residents."], ["Full-stack engineer", "Next.js, Postgres, a love for small details."], ["Trust and safety analyst", "Own verification, SOS drills and the leakage monitor."]].map(([t, d]) => <div key={t} className="rounded-2xl border-2 border-ink bg-cream p-5"><b className="display text-xl">{t}</b><p className="mt-1">{d}</p></div>)}</div>
      </Section>
      <Section tone="cream"><div className="mx-auto max-w-xl"><EnquiryForm kind="careers" cta="Apply" fields={[{ name: "name", label: "Naam", required: true }, { name: "email", label: "Email", type: "email", required: true }, { name: "role", label: "Role you want" }, { name: "message", label: "Why Shell?", type: "textarea" }]} /></div></Section>
    </>
  );
}
