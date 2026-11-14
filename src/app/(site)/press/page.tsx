import { Hero, Section, H2 } from "@/components/page";
import { Logo } from "@/components/icons";
import { PRESS } from "@/lib/content";
export const metadata = { title: "Press kit" };
export default function Page() {
  const colors = [["Deep Tide", "#051F20"], ["Forest", "#0B2B26"], ["Deep Moss", "#163832"], ["Eucalyptus", "#235347"], ["Sage", "#8EB69B"], ["Shell Cream", "#DAF1DE"], ["Warm Sand", "#E8C48A"], ["Sunbeam", "#F2C318"]];
  return (<><Hero eyebrow="Press kit" title="Everything you need to write about Shell." />
    <Section tone="white"><H2 className="text-tide">Boilerplate</H2><p className="mt-3 max-w-2xl text-ink/80">{PRESS.boilerplate}</p>
      <H2 className="mt-12 text-tide">Logo</H2><div className="mt-4 flex flex-wrap gap-4"><div className="card p-8"><Logo size={44} /></div><div className="rounded-2xl bg-tide p-8"><Logo light size={44} /></div></div>
      <H2 className="mt-12 text-tide">Colours</H2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{colors.map(([n, c]) => <div key={n} className="overflow-hidden rounded-xl border border-line"><div className="h-16" style={{ background: c }} /><div className="p-2 text-xs"><strong>{n}</strong><br />{c}</div></div>)}</div>
      <H2 className="mt-12 text-tide">Fonts</H2><p className="mt-3 text-ink/80">Fraunces (headlines), DM Sans (interface), DM Mono (receipts and prices).</p></Section></>);
}
