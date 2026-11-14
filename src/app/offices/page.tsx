import { PageHero, Section, H2 } from "@/components/Page";
import { EnquiryForm } from "@/components/EnquiryForm";
import { buildMeta } from "@/lib/site";

export const metadata = buildMeta({ title: "Shell for hostels and offices", description: "Bulk and recurring plans for hostels and small offices: cleaning, errands, event help and more, with one invoice.", path: "/offices" });

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Hostels aur offices" title={<>Ek invoice. <span className="font-accent text-euca">Poori</span> building.</>} sub="Bulk aur recurring plans: safai, errands, event help, parcel handling. Ek point of contact, GST invoice, aur ek insaan jo zimmedar hai." />
      <Section tone="paper">
        <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
          <div>
            <H2>Kya kaam aata hai</H2>
            <ul className="mt-5 space-y-3 text-lg">
              {["Hostel floors ki weekly safai", "Office pantry aur utensils", "Event setup aur tear-down", "Courier aur parcel handling", "Exam-week support for hostel residents", "Monthly plan, ek GST invoice"].map((x) => <li key={x} className="rounded-2xl bg-cream px-4 py-3 ring-1 ring-tide">{x}</li>)}
            </ul>
            <p className="hand mt-6 text-2xl text-euca">Routines abhi aa raha hai. Tab tak ye plans ops ke saath manually chalte hain.</p>
          </div>
          <EnquiryForm kind="office" />
        </div>
      </Section>
    </>
  );
}
