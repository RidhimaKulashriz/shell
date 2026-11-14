import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHero, Section } from "@/components/site/Bits";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Contact Shell", description: "Write to us, message on WhatsApp, or reach the Grievance Officer.", path: "/contact" });

export default function Page() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999900000";
  return (
    <>
      <PageHero eyebrow="baat karo" title="Humse" em="baat karo." />
      <Section tone="paper">
        <div className="grid gap-10 md:grid-cols-2">
          <EnquiryForm kind="contact" fields={[{ name: "name", label: "Naam", required: true }, { name: "email", label: "Email", type: "email" }, { name: "phone", label: "Phone", type: "tel" }, { name: "message", label: "Message", type: "textarea", required: true }]} />
          <div className="space-y-5">
            <a className="btn btn-forest" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp pe likho</a>
            <p>Email: hello@shell.example</p>
            <div className="receipt scallop-b"><b>Grievance Officer</b><div className="perf" /><p>Name: [to be appointed]</p><p>Address: [registered office, Delhi]</p><p>Email: grievance@shell.example</p><p>We respond within 24 hours and resolve within 15 days.</p></div>
          </div>
        </div>
      </Section>
    </>
  );
}
