import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero, Section } from "@/components/site/Bits";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Stamp } from "@/components/ui";
import { meta } from "@/lib/seo";

const LINES: Record<string, { name: string; hi: string; tag: string; body: string[]; examples: string[]; soon?: boolean; cta?: [string, string] }> = {
  quick: { name: "Shell Quick", hi: "एक छोटा काम, आज ही", tag: "Single small tasks", body: ["Quick is for one thing you do not want to do today: a parcel from the gate, a pile of utensils, a chemist run. A helper from your own society picks it up.", "Because small jobs have thin margins, Quick has a minimum order of ₹199 and a platform-fee floor. Neighbours in the same tower can pool jobs in a Shell Circle to bring the price per flat down."], examples: ["Parcel pickup or drop", "Utensil washing", "Groceries run with a spending cap", "Queueing for you", "Pet walks"], cta: ["Estimate a Quick task", "/pricing"] },
  managed: { name: "Shell Managed", hi: "इवेंट, शिफ्टिंग, पूरे घर की तैयारी", tag: "Plans with a coordinator", body: ["Managed is where Shell takes full responsibility. You send one message, a person builds a multi-task plan with a timeline, and one coordinator follows it to the end.", "A coordination fee applies to plans with three or more tasks. You see it as its own line on the receipt, together with the platform fee. In return you get one point of contact, one payment and the Shell Guarantee across every task."], examples: ["Guests Are Coming", "Move-In Ready", "Diwali Ready", "Party Prep", "New Flat Setup"], cta: ["See the Packs", "/packs"] },
  routines: { name: "Shell Routines", hi: "रोज़ या हफ़्ते की मदद", tag: "Repeating help, coming soon", body: ["Routines will let you repeat a past order weekly, fortnightly or monthly, with the same helper, pause, skip and auto-pay.", "We are building it after the first society is running smoothly. Tell us what you would repeat and we will build that first."], examples: ["Weekday utensils", "Weekly deep clean", "Daily dog walk"], soon: true },
  plus: { name: "Shell Plus", hi: "सब्सक्रिप्शन", tag: "Subscription, later", body: ["Plus will bundle perks: waived platform fees, priority Rush, Circle credits and a monthly Wrapped.", "Not yet. We want repeat usage to prove it is worth a subscription first."], examples: ["Waived platform fee", "Priority scheduling", "Monthly credits"], soon: true },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = LINES[slug];
  return l ? meta({ title: l.name, description: `${l.name}: ${l.tag}. ${l.body[0].slice(0, 110)}`, path: `/services/${slug}` }) : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = LINES[slug];
  if (!l) notFound();
  return (
    <>
      <PageHero eyebrow={l.hi} title={l.name} em={l.soon ? "(coming soon)" : undefined} sub={l.tag}>{l.soon && <Stamp label="Coming soon" tone="brick" large />}</PageHero>
      <Section tone="paper">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4 text-lg">{l.body.map((b) => <p key={b}>{b}</p>)}{l.cta && <Link href={l.cta[1]} className="btn btn-sun mt-2">{l.cta[0]}</Link>}</div>
          <div className="rounded-2xl border border-ink/20 bg-cream p-5"><h2 className="display text-2xl">Examples</h2><ul className="mt-3 space-y-2">{l.examples.map((e) => <li key={e} className="flex gap-2"><span className="text-euc">+</span>{e}</li>)}</ul></div>
        </div>
      </Section>
      {l.soon && <Section tone="cream"><div className="mx-auto max-w-lg"><h2 className="display mb-4 text-3xl">Notify me when it is ready.</h2><EnquiryForm kind="notify" presets={{ message: `Notify me about ${l.name}` }} fields={[{ name: "name", label: "Name", required: true }, { name: "phone", label: "WhatsApp number", type: "tel" }, { name: "message", label: "What would you repeat?", type: "textarea" }]} cta="Notify me" success="Done. We will tell you as soon as it is ready." /></div></Section>}
    </>
  );
}
