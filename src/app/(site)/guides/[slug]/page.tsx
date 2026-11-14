import { notFound } from "next/navigation";
import Link from "next/link";
import { GUIDES } from "@/lib/content";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const g = GUIDES.find((x) => x.slug === slug); return g ? { title: g.title, description: g.summary } : {}; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const g = GUIDES.find((x) => x.slug === slug); if (!g) notFound();
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: g.title, author: { "@type": "Person", name: g.author }, datePublished: g.date };
  return (<article className="mx-auto max-w-3xl px-5 py-14"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    <p className="text-sm text-ink/60">{g.author} · {g.read} min read</p><h1 className="mt-2 text-4xl font-semibold text-tide md:text-5xl">{g.title}</h1><p className="mt-4 text-xl text-ink/70">{g.summary}</p>
    <nav aria-label="Contents" className="card mt-8 p-4 text-sm"><strong>In this guide</strong><ol className="mt-2 list-decimal pl-5">{g.body.map(([h], i) => <li key={h}><a className="underline" href={`#h${i}`}>{h}</a></li>)}</ol></nav>
    <div className="prose-s mt-8">{g.body.map(([h, p], i) => <section key={h}><h2 id={`h${i}`} className="font-semibold text-tide">{h}</h2><p>{p}</p></section>)}</div>
    <div className="mt-10 rounded-2xl bg-cream p-6"><p className="font-semibold">Want this handled for you?</p><Link href="/packs" className="btn btn-primary mt-3">See packs</Link></div>
    <h2 className="mt-12 text-xl font-semibold">More guides</h2><ul className="mt-2 space-y-1">{GUIDES.filter((x) => x.slug !== g.slug).map((x) => <li key={x.slug}><Link className="underline" href={`/guides/${x.slug}`}>{x.title}</Link></li>)}</ul></article>);
}
