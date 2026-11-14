import { notFound } from "next/navigation";
import { PageHero, Section } from "@/components/site/Bits";
import { LEGAL } from "@/lib/legal";
import { meta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = LEGAL.find((l) => l.slug === slug);
  return d ? meta({ title: d.title, description: `${d.title} for Shell. Draft v${d.version}, pending legal review.`, path: `/legal/${d.slug}` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = LEGAL.find((l) => l.slug === slug);
  if (!d) notFound();
  return (
    <>
      <PageHero title={d.title} sub={`Version ${d.version}. Effective ${d.effective}.`}><span className="stamp stamp-brick">Draft: needs lawyer review</span></PageHero>
      <Section tone="paper">
        <div className="mx-auto max-w-3xl space-y-8">
          {d.sections.map(([h, b], i) => <div key={h}><h2 className="display text-2xl">{i + 1}. {h}</h2><p className="mt-2 text-lg">{b}</p></div>)}
          <div className="receipt scallop-b"><b>Changelog</b><div className="perf" />{d.changelog.map((c) => <p key={c}>{c}</p>)}</div>
        </div>
      </Section>
    </>
  );
}
