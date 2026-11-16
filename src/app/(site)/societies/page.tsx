import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHero, Section } from "@/components/site/Bits";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Shell for societies (RWA)", description: "Resident-verified helpers, fewer unknown people at the gate, a gate-pass system, resident perks and revenue share for the society fund.", path: "/societies" });

export default function Page() {
  return (
    <>
      <PageHero eyebrow="for RWAs" title="Fewer unknown" em="faces at the gate." sub="Shell brings verified, trained helpers with a gate pass for the guard and a share of fees for your society fund." />
      <Section tone="paper">
        <div className="grid gap-5 md:grid-cols-3">{[["Verified helpers", "Every helper is ID checked, college or work verified, and trained. You get a roster you can approve."], ["Gate-pass system", "Each visit sends a QR gate pass to the guard. The guard sees who, for which flat, and when."], ["Revenue share", "A share of Shell fees (we propose 2 percent) goes to your society fund. Residents get a perk on their first order."]].map(([t, d], i) => <div key={t} className="rounded-2xl border border-ink/20 bg-cream p-5" style={{ transform: `rotate(${[-1, 0.7, -0.6][i]}deg)` }}><h2 className="display text-2xl">{t}</h2><p className="mt-2">{d}</p></div>)}</div>
      </Section>
      <Section tone="dark">
        <h2 className="display text-4xl">Onboarding, chaar kadam</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">{["Committee call and approval", "Gates, towers and guard briefing", "Resident verification by flat number", "Pilot week with a small helper roster"].map((s, i) => <li key={s} className="rounded-2xl border border-sage/60 p-4"><span className="mono text-3xl text-sand">{i + 1}</span><p className="mt-2">{s}</p></li>)}</ol>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div><h3 className="display text-2xl">Guard workflow</h3><p className="mt-2">The guard gets a QR on their phone for each approved visit with helper name, photo, flat and window. The guard scans it, helper enters. Check-out is recorded. A guard can deny entry and the job is rescheduled with a credit.</p></div>
          <div className="note rotate-1 text-ink"><b>Sample announcement</b><p className="mt-2 text-sm">Dear residents, from Saturday Shell will offer verified home help in our society. Every visit comes with a gate pass. Please register at the guard desk if asked. - RWA Committee</p></div>
        </div>
      </Section>
      <Section tone="cream">
        <div className="mx-auto max-w-xl"><h2 className="display mb-4 text-3xl">Tell us about your society</h2><EnquiryForm kind="society" cta="Send enquiry" fields={[{ name: "name", label: "Contact person", required: true }, { name: "role", label: "Role (secretary, president...)" }, { name: "society", label: "Society name", required: true }, { name: "city", label: "City" }, { name: "flats", label: "Number of flats", type: "number" }, { name: "phone", label: "WhatsApp number", type: "tel", required: true }, { name: "callTime", label: "Preferred call time", type: "select", options: ["Morning", "Afternoon", "Evening"] }]} /></div>
      </Section>
    </>
  );
}
