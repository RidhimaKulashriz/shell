import { Hero, Section } from "@/components/page";
import { ContactForm } from "@/components/site";
export const metadata = { title: "Contact", description: "Talk to the Shell team." };
export default function Page() {
  return (<><Hero eyebrow="Contact" title="Talk to a person." />
    <Section tone="white"><div className="grid gap-8 md:grid-cols-[1.2fr_1fr]"><ContactForm kind="contact" fields={[{ name: "name", label: "Your name", required: true }, { name: "email", label: "Email", type: "email", required: true }, { name: "message", label: "How can we help?", type: "textarea", required: true }]} />
      <div className="space-y-4"><div className="card p-5"><h2 className="text-lg font-semibold">Quick answers</h2><p className="text-sm text-ink/70">WhatsApp +91 98100 00000<br />hello@shell.example</p></div>
        <div className="card p-5"><h2 className="text-lg font-semibold">Grievance officer</h2><p className="text-sm text-ink/70">To be appointed (placeholder). grievance@shell.example. We respond within 72 hours.</p></div></div></div></Section></>);
}
