import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHero, Section } from "@/components/site/Bits";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Shell for hostels and offices", description: "Bulk and recurring plans for hostels, PGs and offices: cleaning, errands, event help and more.", path: "/hostels-offices" });

export default function Page() {
  return (
    <>
      <PageHero eyebrow="B2B" title="Hostels, PGs," em="aur offices." sub="Recurring cleaning, errands, event help and moving, billed monthly with one coordinator." />
      <Section tone="paper"><div className="grid gap-5 md:grid-cols-3">{[["Recurring plans", "Daily or weekly routines with the same helper team."], ["Bulk pricing", "Volume rates and one monthly GST invoice."], ["One coordinator", "A named person who owns the schedule and replacements."]].map(([t, d], i) => <div key={t} className="rounded-2xl border-2 border-ink bg-cream p-5" style={{ transform: `rotate(${[-0.8, 0.8, -0.4][i]}deg)` }}><h2 className="display text-2xl">{t}</h2><p className="mt-2">{d}</p></div>)}</div></Section>
      <Section tone="cream"><div className="mx-auto max-w-xl"><EnquiryForm kind="b2b" cta="Enquiry bhejo" fields={[{ name: "name", label: "Contact person", required: true }, { name: "org", label: "Hostel or office name", required: true }, { name: "type", label: "Type", type: "select", options: ["Hostel or PG", "Office", "Co-working", "Other"] }, { name: "size", label: "Number of residents or seats", type: "number" }, { name: "email", label: "Work email", type: "email" }, { name: "phone", label: "WhatsApp number", type: "tel", required: true }, { name: "message", label: "What do you need?", type: "textarea" }]} /></div></Section>
    </>
  );
}
