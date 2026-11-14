import Link from "next/link";
import { Hero, Section } from "@/components/page";
import { GUIDES } from "@/lib/content";
export const metadata = { title: "Guides", description: "Practical guides for a more comfortable home." };
export default function Page() {
  return (<><Hero eyebrow="Guides" title="Practical, short and useful." />
    <Section tone="white"><div className="grid gap-6 md:grid-cols-3">{GUIDES.map((g) => <Link key={g.slug} href={`/guides/${g.slug}`} className="card p-5 hover:border-euca"><div className="text-xs text-ink/50">{g.read} min read</div><h2 className="mt-1 text-xl font-semibold text-tide">{g.title}</h2><p className="mt-2 text-sm text-ink/70">{g.summary}</p></Link>)}</div></Section></>);
}
