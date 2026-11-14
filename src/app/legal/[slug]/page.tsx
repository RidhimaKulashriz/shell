import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL } from "@/lib/content";
import { buildMeta } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = LEGAL.find((x) => x.slug === slug);
  return d ? buildMeta({ title: `${d.title} (draft)`, description: `${d.title} for Shell. Version ${d.version}, draft pending legal review.`, path: `/legal/${slug}` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = LEGAL.find((x) => x.slug === slug);
  if (!d) notFound();
  return (
    <article className="band-paper px-5 py-12 md:px-10 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="stamp mb-4">DRAFT, NEEDS LAWYER REVIEW</p>
        <h1 className="font-display text-4xl font-black md:text-6xl">{d.title}</h1>
        <p className="mt-2 font-mono text-xs">Version {d.version} · Effective {d.effective}</p>
        <div className="mt-8 space-y-6">
          {d.sections.map((s) => <section key={s.h}><h2 className="font-display text-2xl font-bold">{s.h}</h2><p className="mt-1 leading-relaxed">{s.p}</p></section>)}
        </div>
        <h2 className="font-display mt-10 text-2xl font-bold">Changelog</h2>
        <ul className="mt-2 font-mono text-sm">{d.changelog.map((c) => <li key={c}>· {c}</li>)}</ul>
        <p className="mt-10 flex flex-wrap gap-3 text-sm">{LEGAL.filter((x) => x.slug !== slug).map((x) => <Link key={x.slug} className="underline" href={`/legal/${x.slug}`}>{x.title}</Link>)}</p>
      </div>
    </article>
  );
}
