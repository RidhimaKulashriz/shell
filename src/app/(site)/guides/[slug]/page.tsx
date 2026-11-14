import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { contentPosts } from "@/db/schema";
import { Markdown, headingsOf } from "@/components/site/Markdown";
import { PageHero, Section } from "@/components/site/Bits";
import { jsonLd, meta, SITE_URL } from "@/lib/seo";
import { fmtDate } from "@/lib/format";

async function load(slug: string) {
  const [p] = await db.select().from(contentPosts).where(eq(contentPosts.slug, slug)).limit(1);
  return p;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  return p ? meta({ title: p.title, description: p.excerpt, path: `/guides/${p.slug}` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  if (!p) notFound();
  const related = (await db.select().from(contentPosts).where(ne(contentPosts.slug, p.slug))).slice(0, 2);
  const toc = headingsOf(p.body);
  const shareUrl = `${SITE_URL}/guides/${p.slug}`;
  return (
    <>
      <PageHero eyebrow={p.tags.join(" · ")} title={p.title} sub={`${p.author} · ${fmtDate(p.publishedAt)} · ${p.readingMin} min read`} />
      <Section tone="paper">
        <div className="grid gap-10 md:grid-cols-[220px_1fr]">
          <aside className="md:sticky md:top-24 md:self-start"><div className="receipt scallop-b !text-xs"><b>In this guide</b><div className="perf" />{toc.map((t) => <a key={t.id} href={`#${t.id}`} className="block py-1 hover:underline">{t.text}</a>)}</div>
            <a className="btn btn-forest btn-sm mt-4" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(p.title + " " + shareUrl)}`}>Share on WhatsApp</a></aside>
          <article className="max-w-2xl"><Markdown body={p.body} />
            <div className="mt-12 border-t-2 border-dashed border-ink/30 pt-6"><h2 className="display text-2xl">Aur padho</h2><ul className="mt-3 space-y-2">{related.map((r) => <li key={r.slug}><Link className="link-quiet font-bold" href={`/guides/${r.slug}`}>{r.title}</Link></li>)}</ul></div></article>
        </div>
      </Section>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd({ "@context": "https://schema.org", "@type": "Article", headline: p.title, author: { "@type": "Organization", name: p.author }, datePublished: p.publishedAt.toISOString(), mainEntityOfPage: shareUrl })} />
    </>
  );
}
