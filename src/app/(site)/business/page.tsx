import { Hero, Section, H2 } from "@/components/page";
import { ContactForm } from "@/components/site";
export const metadata = { title: "For hostels and offices", description: "Bulk and recurring plans for hostels, PGs and offices." };
export default function Page() {
  return (<><Hero eyebrow="For hostels and offices" title="Recurring help for places with many people." lead="Daily cleaning, errands, event support and more, scheduled in bulk with one invoice and one point of contact." />
    <Section tone="white"><div className="grid gap-8 md:grid-cols-2"><div><H2 className="text-tide">What we offer</H2><ul className="mt-4 space-y-2 text-ink/80"><li>Recurring cleaning and errand schedules</li><li>Dedicated helper roster with backup</li><li>GST invoices and monthly billing</li><li>Reports on completion and quality</li></ul></div><ContactForm kind="business" cta="Send enquiry" fields={[{ name: "name", label: "Your name", required: true }, { name: "email", label: "Work email", type: "email", required: true }, { name: "phone", label: "Phone" }, { name: "org", label: "Organisation" }, { name: "message", label: "What do you need?", type: "textarea" }]} /></div></Section></>);
}
