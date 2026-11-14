import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { GUIDES } from "@/lib/content";
import { SITE_URL, buildMeta } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  return g ? buildMeta({ title: g.title, description: g.description, path: `/guides/${slug}` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) notFound();
  const words = g.sections.reduce((a, s) => a + s.p.join(" ").split(" ").length, 0);
  const others = GUIDES.filter((x) => x.slug !== slug);
  const id = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <article className="band-paper px-5 py-12 md:px-10 md:py-20">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: g.title, datePublished: g.date, author: { "@type": "Organization", name: g.author }, publisher: { "@type": "Organization", name: "Shell" }, mainEntityOfPage: `${SITE_URL}/guides/${slug}` }} />
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr_15rem]">
        <div>
          <Link href="/guides" className="font-mono text-xs underline">← Guides</Link>
          <h1 className="font-display mt-3 text-4xl font-black leading-[0.98] md:text-6xl">{g.title}</h1>
          <p className="mt-3 font-mono text-xs">{g.author} · {g.date} · {Math.max(2, Math.round(words / 200))} min read</p>
          <div className="mt-8 space-y-8">
            {g.sections.map((s) => (
              <section key={s.h} id={id(s.h)}>
                <h2 className="font-display text-3xl font-bold">{s.h}</h2>
                {s.p.map((p) => <p key={p} className="mt-3 text-lg leading-relaxed">{p}</p>)}
              </section>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            <a className="pill pill-forest" href={`https://wa.me/?text=${encodeURIComponent(`${g.title} ${SITE_URL}/guides/${slug}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp par share karo</a>
            <Link className="pill pill-sun" href="/waitlist">Join the waitlist</Link>
          </div>
        </div>
        <aside className="md:sticky md:top-28 md:self-start">
          <nav aria-label="Table of contents" className="rounded-2xl bg-cream p-4 ring-2 ring-tide">
            <p className="font-mono text-xs uppercase tracking-widest">Is guide mein</p>
            <ol className="mt-2 space-y-1 text-sm">{g.sections.map((s) => <li key={s.h}><a className="hover:underline" href={`#${id(s.h)}`}>{s.h}</a></li>)}</ol>
          </nav>
          <p className="mt-6 font-mono text-xs uppercase tracking-widest">Aur padho</p>
          <ul className="mt-2 space-y-2 text-sm">{others.map((o) => <li key={o.slug}><Link className="underline" href={`/guides/${o.slug}`}>{o.title}</Link></li>)}</ul>
        </aside>
      </div>
    </article>
  );
}
