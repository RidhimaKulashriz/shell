import { PageHero, Section, H2 } from "@/components/Page";
import { Wordmark } from "@/components/Header";
import { CONTACT, buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Shell press kit", description: "Logo, colours, fonts and a boilerplate for writing about Shell.", path: "/press" });

const COLORS = [["Deep Tide", "#051F20"], ["Forest", "#0B2B26"], ["Deep Moss", "#163832"], ["Eucalyptus", "#235347"], ["Sage", "#8EB69B"], ["Shell Cream", "#DAF1DE"], ["Warm Sand", "#E8C48A"], ["Sunbeam", "#F2C318"], ["Paper", "#F4F1E6"], ["Ink", "#0E1A17"]];

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Press" title={<>Shell ke baare mein <span className="font-accent text-euca">likhna</span> hai?</>} sub={`Press queries: ${CONTACT.email}`} />
      <Section tone="paper">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <H2 className="!text-4xl">Logo</H2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="grid h-32 place-items-center rounded-2xl bg-cream ring-2 ring-tide"><Wordmark /></div>
              <div className="band-tide grid h-32 place-items-center rounded-2xl"><Wordmark tone="light" /></div>
            </div>
            <a href="/icon.svg" download className="pill pill-forest mt-4">Download icon (SVG)</a>
            <H2 className="mt-10 !text-4xl">Fonts</H2>
            <p className="mt-2">Fraunces (headlines), Instrument Serif italic (emphasis), DM Sans (UI), DM Mono (receipts), Caveat (handwriting), Noto Sans Devanagari (Hindi). All on Google Fonts.</p>
          </div>
          <div>
            <H2 className="!text-4xl">Colours</H2>
            <ul className="mt-4 grid grid-cols-2 gap-3">{COLORS.map(([n, h]) => <li key={h} className="overflow-hidden rounded-xl ring-1 ring-tide"><div className="h-14" style={{ background: h }} /><div className="bg-white/70 px-3 py-1.5 text-sm"><b>{n}</b> <span className="font-mono text-xs">{h}</span></div></li>)}</ul>
            <H2 className="mt-10 !text-4xl">Boilerplate</H2>
            <p className="receipt mt-2 p-4 text-sm leading-relaxed">Shell is a managed life-assistant service for Indian apartment societies, starting in one society in Delhi. Customers write one message in Hindi, English or Hinglish; Shell plans the work, assigns verified helpers, and stays until it is done. Tagline: Get comfortable. We&apos;ve got it.</p>
          </div>
        </div>
      </Section>
    </>
  );
}
