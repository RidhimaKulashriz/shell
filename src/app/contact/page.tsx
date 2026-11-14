import { PageHero, Section } from "@/components/Page";
import { EnquiryForm } from "@/components/EnquiryForm";
import { CONTACT, buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Contact Shell", description: "Write to us, message on WhatsApp, or reach the Grievance Officer.", path: "/contact" });

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Baat karo" title={<>Humse <span className="font-accent text-euca">seedha</span> poochho.</>} />
      <Section tone="paper">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div><p className="font-mono text-xs uppercase tracking-widest">WhatsApp</p><a className="font-display text-3xl font-bold underline decoration-sun decoration-[3px]" href={`https://wa.me/${CONTACT.whatsapp}`}>{CONTACT.whatsappDisplay}</a></div>
            <div><p className="font-mono text-xs uppercase tracking-widest">Email</p><a className="font-display text-3xl font-bold" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></div>
            <div><p className="font-mono text-xs uppercase tracking-widest">Safety line (24x7)</p><a className="font-display text-3xl font-bold" href={`tel:${CONTACT.safetyLine.replace(/\s/g, "")}`}>{CONTACT.safetyLine}</a></div>
            <div className="rounded-2xl bg-sand p-4 ring-2 ring-tide"><p className="font-display text-xl font-bold">Grievance Officer</p><p className="text-sm">Name: [to be appointed before launch]<br />Address: [registered office]<br />Reply within 48 hours, resolution in 15 days.</p></div>
          </div>
          <EnquiryForm kind="contact" />
        </div>
      </Section>
    </>
  );
}
