import Link from "next/link";
import { Hero, Section, H2 } from "@/components/page";
import { Icon } from "@/components/icons";
import { allCategories } from "@/lib/stats";
import { formatINR } from "@/lib/pricing";
export const metadata = { title: "Services", description: "Shell Quick, Shell Managed, Shell Earn and Shell Routines." };
export const dynamic = "force-dynamic";
export default async function Page() {
  const cats = await allCategories();
  return (<>
    <Hero eyebrow="Services" title="Small tasks and big days, handled." lead="Pick a single task or let us run a whole plan. Either way, one point of contact." />
    <Section><div className="grid gap-4 md:grid-cols-2">{[["Shell Quick", "/services/quick", "Single small tasks. Minimum order applies."], ["Shell Managed", "/services/managed", "Events, moves and full home organising."], ["Shell Routines", "/services/routines", "Repeating help. Coming soon."], ["Shell Plus", "/services/plus", "A subscription for regulars. Coming soon."]].map(([t, h, d]) => <Link key={t} href={h} className="card p-6 hover:border-euca"><h3 className="text-2xl font-semibold text-tide">{t}</h3><p className="mt-1 text-ink/70">{d}</p></Link>)}</div></Section>
    <Section tone="white"><H2 className="text-tide">Every task we do</H2><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cats.map((c) => <Link key={c.slug} href={`/tasks/${c.slug}`} className="card flex items-center gap-4 p-4 hover:border-euca"><span className="grid h-12 w-12 place-items-center rounded-full bg-cream text-euca"><Icon name={c.icon} size={26} /></span><span><span className="block font-semibold">{c.name}</span><span className="text-xs text-ink/60">From {formatINR(c.baseRate)} per {c.unit}</span></span></Link>)}</div></Section>
  </>);
}
