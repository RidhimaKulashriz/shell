import { Wordmark } from "@/components/Icon";
import { PageHero, Section } from "@/components/site/Bits";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Press kit", description: "Shell logo, colours, fonts and boilerplate.", path: "/press" });
const COLORS = [["Deep Tide", "#051F20"], ["Forest", "#0B2B26"], ["Deep Moss", "#163832"], ["Eucalyptus", "#235347"], ["Sage", "#8EB69B"], ["Shell Cream", "#DAF1DE"], ["Warm Sand", "#E8C48A"], ["Sunbeam", "#F2C318"], ["Paper", "#F4F1E6"], ["Ink", "#0E1A17"]];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="press ke liye" title="Press" em="kit." />
      <Section tone="paper">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-ink bg-cream p-8 text-forest"><Wordmark size={64} /><p className="mt-4 text-sm"><a className="link-quiet" href="/icon.svg" download>Download the mark (SVG)</a></p></div>
          <div><h2 className="display text-2xl">Boilerplate</h2><p className="mt-2">Shell is a managed personal life-assistant service for Indian apartment societies. Customers write one message in Hindi, English or Hinglish; Shell plans it, sends verified helpers and takes responsibility until it is done. Shell is launching first inside one apartment society in Delhi.</p><h2 className="display mt-6 text-2xl">Fonts</h2><p>Fraunces (headlines), Instrument Serif italic (emphasis), DM Sans (interface), DM Mono (prices, IDs), Caveat (handwriting), Noto Sans Devanagari (Hindi).</p></div>
        </div>
        <h2 className="display mt-10 text-2xl">Colours</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">{COLORS.map(([n, c]) => <div key={n} className="overflow-hidden rounded-xl border-2 border-ink"><div className="h-16" style={{ background: c }} /><div className="bg-paper p-2 text-xs"><b>{n}</b><div className="mono">{c}</div></div></div>)}</div>
      </Section>
    </>
  );
}
