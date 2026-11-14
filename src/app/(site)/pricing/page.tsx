import { Hero, Section, H2, Faq } from "@/components/page";
import { Estimator } from "@/components/site";
import { formatINR, DEFAULT_PRICING } from "@/lib/pricing";
import { getPricing } from "@/lib/settings";
export const metadata = { title: "Pricing and estimator", description: "Transparent pricing. See your estimate before you commit." };
export const dynamic = "force-dynamic";
export default async function Page() {
  const cfg = await getPricing();
  return (<>
    <Hero eyebrow="Pricing" title="You see the price before you commit." lead="Price is task time × rate, plus a small platform fee and, on bigger plans, a coordination fee. No hidden charges." />
    <Section tone="white"><Estimator /></Section>
    <Section><div className="grid gap-8 md:grid-cols-2"><div><H2 className="text-tide">How fees work</H2>
      <ul className="mt-5 space-y-3 text-ink/80"><li><strong>Platform fee:</strong> {Math.round(cfg.platformFeePct * 100)}% of the subtotal, never less than {formatINR(cfg.feeFloor)}. It covers verification, payments, insurance and support.</li><li><strong>Coordination fee:</strong> {formatINR(cfg.coordinationFee)} when your plan has {cfg.coordinationMinTasks} or more tasks. It pays for planning, scheduling and backup helpers.</li><li><strong>Minimum order:</strong> {formatINR(cfg.minOrder)}.</li><li><strong>Urgency:</strong> same-day is ×{cfg.urgency.same_day}, Rush (within 90 minutes) is ×{cfg.urgency.rush}.</li><li><strong>Travel:</strong> ₹0 inside your society.</li></ul></div>
      <div className="rounded-3xl bg-tide p-7 text-cream"><H2>The Shell Guarantee</H2><ul className="mt-4 space-y-2 text-sage"><li>Free rework within 24 hours</li><li>Damage cover on every job</li><li>Payment held until you approve</li><li>Refund if we can&apos;t deliver</li></ul></div></div></Section>
    <Section tone="cream"><H2 className="text-tide">Doing it yourself isn&apos;t free</H2><p className="mt-3 max-w-2xl text-ink/75">Cleaning four rooms takes most people about 3 to 4 hours. Add the shopping trip, and the organising, and a weekend disappears. Your time has a price too.</p>
      <div className="mt-8"><Faq items={[{ q: "Is the price I see final?", a: "It's an estimate until you approve your plan. After that, the amount is locked unless you accept a change request." }, { q: "What does Rush cost?", a: `Rush is ×${DEFAULT_PRICING.urgency.rush} the normal price and needs helpers who opted in. We dispatch within 90 minutes inside the society.` }, { q: "How do Circles lower my price?", a: "Each extra flat in your tower and slot reduces everyone's price, up to a cap, because travel and set-up are shared." }, { q: "Are tips included?", a: "No. Tips are optional and 100% go to the helper." }]} /></div></Section></>);
}
