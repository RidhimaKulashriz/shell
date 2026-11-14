"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PulseMap, type MapHelper, type MapTower } from "@/components/maps";
import { Receipt, Ring, Stamp, Tick, type RLine } from "@/components/ui";
import { DEMO_SENTENCE } from "@/lib/keywords";
import { Icon } from "@/components/Icon";

const STEPS = [
  { t: "Ek message likho", d: "Hindi, English ya Hinglish. Text, voice ya photo.", e: "Write one message. Any language, any mix." },
  { t: "Do chhote sawaal", d: "Sirf wahi poochte hain jo plan ke liye zaroori hai. Chips mein jawab do.", e: "At most five questions, one at a time." },
  { t: "Ek receipt, ek plan", d: "Har kaam ki line, price aur time. Ek insaan check karke bhejta hai.", e: "A person reviews the plan before you see it." },
  { t: "Live dekho", d: "Helper kahan hai, kitni der mein, kaunsi manzil par.", e: "Gate 2 se Tower C, 9th floor. Door OTP sirf aapke paas." },
  { t: "Ghar ready", d: "Photos check karo, approve karo, ek Shell Note bhejo.", e: "Payment helper ko tab jaata hai jab aap haan kehte ho." },
];

type MapProps = { boundary: [number, number][]; gates: { name: string; lat: number; lng: number }[]; towers: MapTower[]; helpers: MapHelper[] };

function Screen({ step, sample, map }: { step: number; sample: { lines: RLine[]; total: string }; map: MapProps }) {
  if (step === 0)
    return (
      <div className="flex h-full flex-col justify-end gap-2 p-3">
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-forest p-3 text-sm text-cream">{DEMO_SENTENCE}</div>
        <div className="mono text-right text-[10px] opacity-60">Shell ko bhejo</div>
      </div>
    );
  if (step === 1)
    return (
      <div className="space-y-3 p-3 text-sm">
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-cream p-2.5">Ghar kitne BHK ka hai?</div>
        <div className="flex flex-wrap gap-1.5">{["1 BHK", "2 BHK", "3 BHK"].map((c, i) => <span key={c} className={`chip !min-h-0 !py-1 text-xs ${i === 2 ? "on" : ""}`}>{c}</span>)}</div>
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-cream p-2.5">Groceries ki limit?</div>
        <div className="flex flex-wrap gap-1.5">{["₹1,000", "₹2,000", "Aap decide karo"].map((c, i) => <span key={c} className={`chip !min-h-0 !py-1 text-xs ${i === 1 ? "on" : ""}`}>{c}</span>)}</div>
      </div>
    );
  if (step === 2)
    return (
      <div className="p-2">
        <Receipt key="story-r" title="Guests Aa Rahe Hain" meta="Sample" lines={sample.lines} total={sample.total} className="!p-3 !pb-6 !text-[11px]" baseDelay={100} />
      </div>
    );
  if (step === 3)
    return (
      <div className="p-2">
        <PulseMap {...map} highlightTower="Tower C" labels className="!rounded-2xl" />
        <div className="mt-2 rounded-xl bg-cream p-2 text-xs"><b>Isha</b> Gate 2 par hai, lagbhag 6 min. Tower C, 9th floor. <span className="mono ml-1 rounded bg-sun px-1.5">OTP 4821</span></div>
      </div>
    );
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-3 text-center">
      <Ring pct={100} size={130} label="Ghar Ready" />
      <div className="note -rotate-2 !p-3 hand text-xl">Thank you Isha, alamari ekdum sahi lag rahi hai!</div>
      <div className="flex items-center gap-1 text-xs"><Tick size={16} /> Sab theek hai</div>
    </div>
  );
}

function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[270px] rounded-[38px] border-[3px] border-ink bg-ink p-2 shadow-[8px_8px_0_var(--color-sage)]">
      <div className="mx-auto mb-1 h-4 w-20 rounded-full bg-ink" />
      <div className="h-[470px] overflow-hidden rounded-[28px] bg-paper text-ink">{children}</div>
    </div>
  );
}

export function PinnedStory({ sample, map }: { sample: { lines: RLine[]; total: string }; map: MapProps }) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const on = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(0.999, Math.max(0, -r.top / (r.height - window.innerHeight)));
      setStep(Math.floor(p * STEPS.length));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <section className="dark-band relative" aria-labelledby="story-h">
      {/* desktop: pinned */}
      <div ref={ref} className="relative hidden md:block" style={{ height: `${STEPS.length * 85}vh` }}>
        <div className="sticky top-0 mx-auto grid h-screen max-w-6xl grid-cols-[1.1fr_1fr] items-center gap-10 px-8">
          <div>
            <span className="hand text-3xl text-sand">ek message, ek result</span>
            <h2 id="story-h" className="display mt-2 text-6xl">Kaam karwana, ek hi baat mein.</h2>
            <ol className="mt-8 space-y-4">
              {STEPS.map((s, i) => (
                <li key={s.t} className={`flex gap-4 transition-all duration-500 ${i === step ? "translate-x-2 opacity-100" : "opacity-35"}`}>
                  <span className="mono grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-sage text-sm">{i + 1}</span>
                  <span><b className="display block text-2xl">{s.t}</b><span className="block text-cream/85">{s.d}</span>{i === step && <span className="serif-i block text-lg text-sand">{s.e}</span>}</span>
                </li>
              ))}
            </ol>
          </div>
          <Phone><Screen step={step} sample={sample} map={map} /></Phone>
        </div>
      </div>
      {/* mobile: vertical cards with a progress dot rail */}
      <div className="px-5 py-14 md:hidden">
        <span className="hand text-3xl text-sand">ek message, ek result</span>
        <h2 className="display mt-1 text-4xl">Kaam karwana, ek hi baat mein.</h2>
        <div className="relative mt-8 space-y-10 pl-8">
          <span className="absolute bottom-0 left-[11px] top-2 w-0.5 bg-sage/40" aria-hidden />
          {STEPS.map((s, i) => (
            <div key={s.t} className="relative">
              <span className="mono absolute -left-8 top-0 grid h-6 w-6 place-items-center rounded-full bg-sand text-xs text-ink">{i + 1}</span>
              <h3 className="display text-2xl">{s.t}</h3>
              <p className="mt-1 text-cream/85">{s.d}</p>
              <div className="mt-4"><Phone><Screen step={i} sample={sample} map={map} /></Phone></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FourJobs() {
  const [mode, setMode] = useState<"today" | "shell">("today");
  const threads = [["Cleaner bhaiya", "kal aa jaunga"], ["Grocery app", "Substitute chalega?"], ["Decorator", "Advance bhej do"], ["Bai ji", "Kal chhutti"]];
  return (
    <section className="bg-cream px-5 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-4xl md:text-6xl">Chaar kaam,<br /><span className="serif-i">ek hi bill.</span></h2>
          <div role="tablist" aria-label="Compare" className="inline-flex rounded-full border-2 border-ink bg-paper p-1">
            {(["today", "shell"] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-full px-5 py-2 font-bold ${mode === m ? "bg-forest text-cream" : ""}`}>{m === "today" ? "Aaj" : "Shell ke saath"}</button>
            ))}
          </div>
        </div>
        <div key={mode} className="mt-10 grid items-center gap-8 md:grid-cols-2" style={{ animation: "flipIn .55s cubic-bezier(.3,.8,.3,1)" }}>
          <style>{`@keyframes flipIn{from{transform:perspective(900px) rotateY(-70deg);opacity:0}to{transform:none;opacity:1}}`}</style>
          {mode === "today" ? (
            <>
              <div className="relative mx-auto w-[260px] rotate-[-3deg] rounded-[32px] border-[3px] border-ink bg-paper p-3 shadow-[8px_8px_0_var(--color-ink)]">
                {threads.map(([n, m], i) => (
                  <div key={n} className="mb-2 flex items-center gap-2 rounded-2xl bg-cream p-2" style={{ transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-sand text-xs font-bold">{n[0]}</span>
                    <span className="flex-1 text-xs"><b>{n}</b><br />{m}</span>
                    <span className="mono grid h-5 min-w-5 place-items-center rounded-full bg-brick px-1 text-[10px] text-cream">{i + 2}</span>
                  </div>
                ))}
                <p className="hand text-center text-xl text-brick">4 chats, 4 prices, 4 reminders</p>
              </div>
              <div><h3 className="display text-3xl">Aaj aap manager ho.</h3><p className="mt-3 text-lg">Har kaam ke liye alag insaan, alag chat, alag rate. Kaun kab aayega, ye yaad rakhna bhi ek kaam hai. (Illustration)</p></div>
            </>
          ) : (
            <>
              <Receipt title="Aaj shaam tak" meta="1 message, 1 receipt" lines={[{ name: "Cleaning", price: "included", stamp: true }, { name: "Groceries", price: "included", stamp: true }, { name: "Wardrobe", price: "included", stamp: true }, { name: "Decoration", price: "included", stamp: true }]} total="1 bill" totalLabel="PAY ONCE" rot={-1.5} className="mx-auto w-full max-w-sm" footer="Illustration of one plan" />
              <div><h3 className="display text-3xl">Ek insaan poochne ke liye.</h3><p className="mt-3 text-lg">Hum plan banate hain, helpers bhejte hain, timing sambhalte hain. Late ho gaya to backup ready hai.</p></div>
            </>
          )}
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[["phone", "One point of contact"], ["wallet", "One payment"], ["shield", "One guarantee"]].map(([ic, t], i) => (
            <div key={t} className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-paper p-4" style={{ transform: `rotate(${[-1, 0.8, -0.5][i]}deg)` }}><Icon name={ic} size={38} /><span className="display text-xl">{t}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StampPromises() {
  const items = ["Verified government ID", "College ID checked", "Door OTP on every job", "Gate pass sent to the guard", "Live SOS, 20 second response", "We hold your payment until you approve"];
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {items.map((t, i) => (
        <li key={t} className="flex items-center gap-3 rounded-2xl border-2 border-sage/60 p-3" style={{ transform: `rotate(${(i % 3) - 1}deg)` }}>
          <span className="mono grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-sand text-lg text-sand">{i + 1}</span>
          <span className="font-semibold">{t}</span>
          <span className="ml-auto hidden sm:block"><Stamp label="verified" delay={i * 150} rot={-6 + i * 3} /></span>
        </li>
      ))}
    </ol>
  );
}
