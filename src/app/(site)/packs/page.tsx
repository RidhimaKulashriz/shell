import Link from "next/link";
import { Hero, Section } from "@/components/page";
import { allPacks } from "@/lib/stats";
import { packEstimate } from "@/lib/content";
import { formatINR, formatDuration } from "@/lib/pricing";
export const metadata = { title: "Packs", description: "Ready-made plans for guests, moving, festivals, exams and weekends." };
export const dynamic = "force-dynamic";
export default async function Page() {
  const packs = await allPacks();
  return (<><Hero eyebrow="Packs" title="Ready-made plans for the moments that matter." lead="Each pack is a plan we've already worked out. Adjust it however you like." />
    <Section><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{packs.map((p, i) => { const e = packEstimate(p.items); return (
      <Link key={p.slug} href={`/packs/${p.slug}`} className="ticket p-6 transition-transform hover:-translate-y-1" style={{ transform: `rotate(${[-0.8, 0.6, -0.4][i % 3]}deg)` }}>
        <p className="text-[0.7rem] font-bold tracking-[0.2em] text-euca">PACK {String(i + 1).padStart(2, "0")}</p><h2 className="text-2xl font-semibold text-tide">{p.name}</h2><p className="mt-1 text-sm text-ink/70">{p.tagline}</p><hr className="perf" />
        <div className="flex justify-between text-sm" style={{ fontFamily: "var(--font-mono)" }}><span>{formatDuration(e.durationMin)}</span><strong>from {formatINR(e.total)}</strong></div></Link>); })}</div></Section></>);
}
