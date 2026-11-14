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
      <PageHero eyebrow={pick(lang, "pehle log bano", "पहले लोग बनिए")} title={pick(lang, "Naam likho,", "नाम लिखिए,")} em={pick(lang, "line mein aao.", "लाइन में आइए।")} sub={pick(lang, "WhatsApp number verify karo, queue mein apni jagah dekho. Har dost ke saath aap 5 jagah upar aate ho, aur launch par credit milta hai.", "WhatsApp नंबर वेरिफाई कीजिए और कतार में अपनी जगह देखिए। हर दोस्त के साथ आप 5 जगह ऊपर आते हैं।")} />
      <Section tone="dark" className="!pt-10">
        <div className="grid items-start gap-10 md:grid-cols-[1fr_1.1fr]">
          <div className="space-y-5 text-lg">
            <p>Hum ek society se shuru kar rahe hain. Jahan sabse zyada padosi judte hain, wahan hum pehle pahunchte hain.</p>
            <ul className="space-y-2 text-cream/90">{["One signup per WhatsApp number, OTP verified", "Double opt-in: a confirm message on WhatsApp", "Your referral link moves you up 5 places per verified friend", "We never share your number"].map((x) => <li key={x} className="flex gap-3"><span className="text-sand">+</span>{x}</li>)}</ul>
          </div>
          <div className="text-ink"><WaitlistForm societies={socs.map((s) => s.name)} initialText={sp.text ?? ""} refCode={sp.ref ?? ""} initialSociety={soc?.name ?? ""} /></div>
        </div>
      </Section>
    </>
  );
}
