import { notFound } from "next/navigation";
import { LEGAL } from "@/lib/content";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const d = LEGAL[(await params).slug]; return d ? { title: d.title } : {}; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const d = LEGAL[(await params).slug]; if (!d) notFound();
  return (<article className="mx-auto max-w-3xl px-5 py-14"><p className="stamp stamp-red">Draft. Needs lawyer review</p><h1 className="mt-4 text-4xl font-semibold text-tide">{d.title}</h1>
    <p className="mt-2 text-sm text-ink/60">Version {d.version} · Effective {d.effective}</p>
    <div className="prose-s mt-8">{d.sections.map(([h, p]) => <section key={h}><h2 className="font-semibold text-tide">{h}</h2><p>{p}</p></section>)}</div>
    <h2 className="mt-8 text-lg font-semibold">Changelog</h2><ul className="mt-2 list-disc pl-5 text-sm text-ink/70">{d.changelog.map((c) => <li key={c}>{c}</li>)}</ul></article>);
}
