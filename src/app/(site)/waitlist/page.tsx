import { PageHero, Section } from "@/components/site/Bits";
import { WaitlistForm } from "@/components/WaitlistForm";
import { meta } from "@/lib/seo";
import { societyList } from "@/lib/site-data";
import { getLang, pick } from "@/lib/lang";

export const metadata = meta({ title: "Join the Shell waitlist", description: "Add your name, verify your WhatsApp number and see your place in the queue. Each friend you bring moves you up five places.", path: "/waitlist" });

export default async function Page({ searchParams }: { searchParams: Promise<{ text?: string; ref?: string; society?: string }> }) {
  const sp = await searchParams;
  const lang = await getLang();
  const socs = await societyList();
  const soc = socs.find((s) => s.slug === sp.society);
  return (
    <>
      <PageHero eyebrow={pick(lang, "be among the first", "पहले लोग बनिए")} title={pick(lang, "Add your name,", "नाम लिखिए,")} em={pick(lang, "take your place.", "लाइन में आइए।")} sub={pick(lang, "Verify your WhatsApp number and see your place in the queue. Every friend moves you up 5 places, and you earn a credit at launch.", "WhatsApp नंबर वेरिफाई कीजिए और कतार में अपनी जगह देखिए। हर दोस्त के साथ आप 5 जगह ऊपर आते हैं।")} />
      <Section tone="dark" className="!pt-10">
        <div className="grid items-start gap-10 md:grid-cols-[1fr_1.1fr]">
          <div className="space-y-5 text-lg">
            <p>We are starting with one society. We open first where the most neighbours have joined.</p>
            <ul className="space-y-2 text-cream/90">{["One signup per WhatsApp number, OTP verified", "Double opt-in: a confirm message on WhatsApp", "Your referral link moves you up 5 places per verified friend", "We never share your number"].map((x) => <li key={x} className="flex gap-3"><span className="text-sand">+</span>{x}</li>)}</ul>
          </div>
          <div className="text-ink"><WaitlistForm societies={socs.map((s) => s.name)} initialText={sp.text ?? ""} refCode={sp.ref ?? ""} initialSociety={soc?.name ?? ""} /></div>
        </div>
      </Section>
    </>
  );
}
