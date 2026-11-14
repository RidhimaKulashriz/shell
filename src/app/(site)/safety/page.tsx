import { PageHero, Section } from "@/components/site/Bits";
import { GuardianPath } from "@/components/home/Sections";
import { StampPromises } from "@/components/home/Story";
import { Stamp } from "@/components/ui";
import { db } from "@/db";
import { helpers } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { meta } from "@/lib/seo";
import { getLang, pick } from "@/lib/lang";

export const metadata = meta({ title: "Safety and trust", description: "Verification steps, door OTP, gate pass, SOS, female-helper option, damage cover, what we never allow, and how disputes work.", path: "/safety" });

export default async function Page() {
  const lang = await getLang();
  const [{ n: total }] = await db.select({ n: count() }).from(helpers);
  const [{ n: active }] = await db.select({ n: count() }).from(helpers).where(eq(helpers.status, "active"));
  const funnel = ["Applied", "ID checked", "College ID checked", "Selfie liveness", "Training passed", "First job shadowed"];
  const never = [["Massage, makeup, personal care", "Physical or personal contact is the highest-risk category. Closed at launch."], ["Homework or assignments", "We explain and tutor. We never do graded work for anyone."], ["Anyone under 18", "Hard-blocked at application and checked against ID."], ["Phone numbers and payments outside Shell", "Chat is scanned and blurred. Off-platform dealing earns a strike because guarantees only work inside Shell."], ["Keeping your key", "Shell never keeps a key. Guard-held or lockbox with a one-time code only."], ["Alcohol, tobacco, anything illegal", "Not on any list, ever."]];
  return (
    <>
      <PageHero tone="dark" eyebrow={pick(lang, "trust first", "भरोसा पहले")} title={pick(lang, "Who is coming", "आपके घर में")} em={pick(lang, "into your home?", "कौन आ रहा है?")} sub="Our promise: nobody enters your home without a verified identity, a door OTP you control, a gate pass your guard has seen, and a way to reach us in 20 seconds." />
      <Section tone="paper">
        <h2 className="display text-4xl">Verification funnel</h2>
        <p className="mt-2 max-w-2xl">Six steps, in this order. Pass-through rates will be published here once we have enough applicants to make them meaningful. Right now {Number(active)} of {Number(total)} applicants are active helpers.</p>
        <div className="mt-8 space-y-2">{funnel.map((f, i) => <div key={f} className="flex items-center gap-3" style={{ width: `${100 - i * 9}%` }}><div className="flex flex-1 items-center justify-between rounded-r-full border border-ink/20 bg-sage px-4 py-3"><b>{i + 1}. {f}</b><Stamp label="step" rot={-4} /></div></div>)}</div>
      </Section>
      <Section tone="tide"><div className="grid items-center gap-10 md:grid-cols-2"><div><h2 className="display text-4xl md:text-5xl">Shell Guardian</h2><p className="mt-4 text-lg">Gate pass QR to the guard. Door OTP to start. Live check-in and check-out. Geofence alerts if a helper leaves the society during a job. Shake your phone three times or hold SOS for two seconds. A silent SOS exists too. It reaches our team in 20 seconds and alerts the guard. Share a live link with a trusted contact.</p><div className="mt-6"><StampPromises /></div></div><GuardianPath /></div></Section>
      <Section tone="cream">
        <div className="grid gap-8 md:grid-cols-2">
          <div><h2 className="display text-3xl">Female-helper option</h2><p className="mt-3">Turn on &lsquo;female helper only&rsquo; in your Home Atlas. We only offer those jobs to women helpers who opted in. If we cannot match one for your slot, we tell you before you pay.</p><h2 className="display mt-8 text-3xl">Data and privacy</h2><p className="mt-3">We never store an Aadhaar number, only a reference and a verified flag from the KYC provider. Location is shared only during an active job, you see a clear indicator, and every staff access to location data or ID documents is logged. You can download or delete your data any time.</p></div>
          <div><h2 className="display text-3xl">Damage cover and disputes</h2><p className="mt-3">Damage is covered up to a set limit under the Shell Guarantee. Raise a dispute from the order with photos, voice or text. We reply within 24 hours and resolve with a redo, partial refund, full refund or credit. You can appeal once.</p><div className="note mt-8 rotate-1"><p className="hand text-2xl">Safety line, 24x7: 1800-000-0000 (placeholder until launch)</p></div></div>
        </div>
      </Section>
      <Section tone="paper"><h2 className="display text-4xl">What we never do</h2><div className="mt-8 grid gap-4 md:grid-cols-2">{never.map(([t, d], i) => <div key={t} className="rounded-2xl border border-ink/20 p-4" style={{ transform: `rotate(${[-0.6, 0.5][i % 2]}deg)` }}><b className="display text-xl">{t}</b><p className="mt-1 text-sm">{d}</p></div>)}</div></Section>
    </>
  );
}
