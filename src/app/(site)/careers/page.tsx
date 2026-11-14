import Link from "next/link";
import { Hero, Section, H2 } from "@/components/page";
export const metadata = { title: "Careers", description: "Join Shell early." };
export default function Page() {
  return (<><Hero eyebrow="Careers" title="Help us build the most trusted service in the neighbourhood." />
    <Section tone="white"><H2 className="text-tide">Open roles</H2><div className="mt-6 divide-y divide-line border-y border-line">{[["Operations associate, Delhi", "Run daily plans, dispatch and support"], ["Community lead, societies", "Onboard societies and guards"], ["Full-stack engineer", "Next.js, Postgres, maps"]].map(([a, b]) => <div key={a} className="flex flex-wrap items-center justify-between gap-2 py-4"><div><div className="font-semibold">{a}</div><div className="text-sm text-ink/60">{b}</div></div><Link href="/contact" className="btn btn-ghost btn-sm">Apply</Link></div>)}</div></Section>
    <Section tone="cream"><H2 className="text-tide">Be one of the first 20 helpers</H2><p className="mt-3 max-w-xl text-ink/75">Early helpers get priority offers and a founding badge on their Skill Passport.</p><Link href="/login?as=helper&next=/helper/apply" className="btn btn-primary mt-5">Apply as a helper</Link></Section></>);
}
