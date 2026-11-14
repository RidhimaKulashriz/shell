import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contentPosts } from "@/db/schema";
import { PageHero, Section } from "@/components/site/Bits";
import { meta } from "@/lib/seo";
import { getLang } from "@/lib/lang";
import { fmtDate } from "@/lib/format";

export const metadata = meta({ title: "Guides", description: "Practical guides for running a home without losing your weekend.", path: "/guides" });

export default async function Page() {
  const [posts, lang] = [await db.select().from(contentPosts).where(eq(contentPosts.published, true)).orderBy(desc(contentPosts.publishedAt)), await getLang()];
  return (
    <>
      <PageHero eyebrow="practical advice" title="Guides," em="short and useful." />
      <Section tone="paper">
        <div className="grid gap-6 md:grid-cols-3">{posts.map((p, i) => <Link key={p.slug} href={`/guides/${p.slug}`} className="receipt scallop-b block transition-transform hover:-translate-y-1" style={{ transform: `rotate(${[-1, 0.8, -0.5][i % 3]}deg)` }}><div className="mono text-xs opacity-60">{fmtDate(p.publishedAt)} · {p.readingMin} min read</div><h2 className="display mt-2 text-2xl" style={{ fontFamily: "var(--font-display)" }}>{lang === "hi" && p.titleHi ? p.titleHi : p.title}</h2><p className="mt-2 text-sm">{p.excerpt}</p></Link>)}</div>
      </Section>
    </>
  );
}
