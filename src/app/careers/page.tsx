import Link from "next/link";
import { PageHero, Section, H2 } from "@/components/Page";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Careers at Shell", description: "Join Shell early: ops, engineering, design, and the first 20 helpers in our pilot society.", path: "/careers" });

const ROLES = [
  ["Ops lead, Delhi", "Run plan reviews, dispatch and the pilot society day to day."],
  ["Full-stack engineer", "Next.js, Postgres, queues. Build the app and the Ops Cockpit."],
  ["Product designer", "Paper-and-ink interfaces that work on cheap Android phones."],
  ["Community lead, colleges", "Bring in student helpers and run the ambassador programme."],
];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Hamare saath" title={<>Pehle bees <span className="font-accent text-euca">helpers</span> mein se ek bano.</>} sub="Pilot society mein hum pehle 20 helpers chun rahe hain. College students, freelancers, skills wale log." >
        <Link href="/waitlist?role=earn" className="pill pill-sun">Helper ke roop mein judo</Link>
      </PageHero>
      <Section tone="paper">
        <H2>Khuli jagah</H2>
        <ul className="mt-8 divide-y-2 divide-dashed divide-tide/30 border-y-2 border-dashed border-tide/30">
          {ROLES.map(([t, d]) => <li key={t} className="flex flex-wrap items-center justify-between gap-3 py-5"><div><p className="font-display text-2xl font-bold">{t}</p><p>{d}</p></div><Link href={`/contact?topic=careers`} className="pill pill-line !py-2.5 text-sm">Batao</Link></li>)}
        </ul>
      </Section>
    </>
  );
}
