import { PageHero, Section } from "@/components/site/Bits";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "About Shell", description: "Why Shell exists, what we believe, how we make money in plain words, and where we are going.", path: "/about" });

export default function Page() {
  return (
    <>
      <PageHero eyebrow="our story" title="Getting things done" em="should not be a job." sub="Shell started with a simple annoyance: getting someone to do a small thing at home should not take four apps and an evening." />
      <Section tone="paper">
        <div className="mx-auto max-w-3xl space-y-5 text-lg">
          <p>We are not building a marketplace where you hunt for workers. We are building a service that takes responsibility for getting it done. That is a different promise, and it needs a different kind of company: smaller, closer, more careful.</p>
          <p>So we begin in one apartment society in Delhi. We learn the gates, the lifts, the guards and the neighbours. Only when that works do we open the next one.</p>
          <h2 className="display pt-4 text-3xl">What we believe</h2>
          <ul className="space-y-2">{["Comfort: step back, get your time back.", "Connection: someone capable is right around the corner.", "Opportunity: anyone with a useful skill can earn."].map((x) => <li key={x} className="flex gap-3"><span className="text-euc">+</span>{x}</li>)}</ul>
          <h2 className="display pt-4 text-3xl">How we make money, plainly</h2>
          <p>A commission on each job (20 to 28 percent, depending on helper level). A coordination fee on plans with three or more tasks. A platform fee with a floor. Later: a Plus subscription, and plans for societies, hostels and offices. Tips go entirely to helpers.</p>
          <div className="note rotate-1"><p className="hand text-3xl">&ldquo;We want you to walk in and find everything ready.&rdquo;</p><p className="mt-2 text-sm">A note from the founders</p></div>
        </div>
      </Section>
      <Section tone="dark">
        <h2 className="display text-4xl">Roadmap</h2>
        <svg viewBox="0 0 800 140" className="mt-8 w-full" aria-label="Roadmap path"><path d="M20 100 C140 20 220 130 340 70 S560 20 640 80 S760 70 780 40" fill="none" stroke="#8EB69B" strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round" />{[["Pilot society", 30, 100], ["Tower A to F", 240, 100], ["3 societies", 450, 40], ["Delhi NCR", 700, 90]].map(([t, x, y]) => <g key={String(t)}><circle cx={Number(x)} cy={Number(y)} r="9" fill="#F2C318" stroke="#051F20" strokeWidth="3" /><text x={Number(x)} y={Number(y) + 30} textAnchor="middle" fontFamily="var(--font-hand)" fontSize="20" fill="#DAF1DE">{t}</text></g>)}</svg>
      </Section>
    </>
  );
}
