"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Receipt, Reveal, Ring, Stamp } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";

/* ---------- H2: problem as sticky notes ---------- */
const NOTES = [
  { t: "Bharosa", a: "Mere ghar mein kaun aa raha hai?", b: "Naam, ID, ya bas ek phone number. Kuch pata nahi.", rot: -3, mt: "md:mt-6" },
  { t: "Quality", a: "Kaam kharab hua to zimmedar kaun?", b: "Bhaiya ne kaha kal theek kar denge. Kal kab aata hai?", rot: 2, mt: "md:-mt-2" },
  { t: "Bhaag-daud", a: "Chaar apps, chaar chats, chaar price.", b: "Ek kaam ke liye teen log, aur sabko address samjhana.", rot: -1.5, mt: "md:mt-10" },
];

export function ProblemNotes() {
  return (
    <div>
      <div className="grid gap-8 md:grid-cols-3 md:gap-6">
        {NOTES.map((n, i) => (
          <Reveal key={n.t} rot={n.rot} delay={i * 120} className={n.mt}>
            <div className="sticky-note relative p-6 transition-transform duration-300 hover:!-rotate-0 hover:-translate-y-2 focus-within:-translate-y-2" tabIndex={0} style={{ transform: `rotate(${n.rot}deg)`, borderRadius: "4px 4px 26px 4px" }}>
              <span className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 rotate-2 bg-sage/70" aria-hidden="true" />
              <h3 className="hand text-4xl leading-none">{n.t}</h3>
              <p className="mt-3 font-semibold">{n.a}</p>
              <p className="mt-1 text-[0.95rem] opacity-80">{n.b}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="font-display mx-auto mt-14 max-w-2xl text-center text-3xl font-semibold leading-tight md:text-5xl"><T k="problem.line" /></p>
    </div>
  );
}

/* ---------- H3: pinned scroll story ---------- */
function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[260px] rounded-[38px] bg-tide p-2.5 shadow-[0_22px_0_rgba(0,0,0,0.25)] ring-2 ring-sage/40 md:w-[290px]">
      <div className="bg-cream relative h-[470px] overflow-hidden rounded-[30px] p-3 text-ink md:h-[520px]">
        <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-tide/30" />
        {children}
      </div>
    </div>
  );
}

function PulseMap() {
  return (
    <svg viewBox="0 0 240 150" className="w-full rounded-2xl bg-tide" role="img" aria-label="Society map: helper at Gate 2 heading to Tower C">
      {[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4, 5].map((c) => {
        const x = 20 + c * 38 + (r % 2) * 19, y = 18 + r * 30;
        return <polygon key={`${r}${c}`} points={`${x},${y - 17} ${x + 16},${y - 8} ${x + 16},${y + 9} ${x},${y + 18} ${x - 16},${y + 9} ${x - 16},${y - 8}`} fill="rgba(142,182,155,0.08)" stroke="#235347" strokeWidth="1" />;
      }))}
      <path d="M30 120 C70 110 90 80 130 78 S190 50 190 40" stroke="#E8C48A" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" fill="none" />
      <rect x="176" y="22" width="26" height="30" rx="3" fill="#8EB69B" stroke="#DAF1DE" strokeWidth="1.5" />
      <text x="189" y="42" textAnchor="middle" fontSize="12" fill="#051F20" fontWeight="700">C</text>
      <text x="30" y="138" fill="#8EB69B" fontSize="9" fontFamily="DM Mono, monospace">Gate 2</text>
      <circle cx="118" cy="84" r="4" fill="none" stroke="#F2C318" className="pulse-ring" />
      <circle cx="118" cy="84" r="5" fill="#F2C318" stroke="#051F20" strokeWidth="2" />
    </svg>
  );
}

function Screen({ step }: { step: number }) {
  if (step === 0)
    return (
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-euca">Tell Shell</p>
        <div className="mt-2 rounded-2xl border-2 border-dashed border-tide/40 bg-white/60 p-3 text-[0.95rem] leading-snug caret">Kal guests aa rahe hain, ghar saaf karwana hai, groceries chahiye, wardrobe organise karna hai, decoration karni hai</div>
        <div className="mt-3 flex gap-2 text-[11px] font-semibold"><span className="rounded-full bg-sand px-3 py-1">kal tak</span><span className="rounded-full bg-sage/60 px-3 py-1">Tower C, 9th</span></div>
        <div className="pill pill-sun mt-4 w-full justify-center !py-3 text-sm">Shell ko bhejo</div>
      </div>
    );
  if (step === 1)
    return (
      <div className="space-y-3 text-sm">
        <p className="font-mono text-[10px] uppercase tracking-widest text-euca">Sawaal 1 of 2</p>
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white p-3">Kitne guests aa rahe hain?</div>
        <div className="flex flex-wrap gap-2 text-[12px] font-semibold"><span className="rounded-full border-2 border-tide px-3 py-1.5">5 se kam</span><span className="rounded-full border-2 border-tide bg-tide px-3 py-1.5 text-cream">6 se 12</span><span className="rounded-full border-2 border-tide px-3 py-1.5">12+</span></div>
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white p-3">Kitne kamre saaf karne hain?</div>
        <div className="flex flex-wrap gap-2 text-[12px] font-semibold"><span className="rounded-full border-2 border-tide px-3 py-1.5">2</span><span className="rounded-full border-2 border-tide bg-tide px-3 py-1.5 text-cream">3</span><span className="rounded-full border-2 border-tide px-3 py-1.5">skip, aap decide karo</span></div>
      </div>
    );
  if (step === 2)
    return (
      <div className="-mx-1 scale-[0.93] origin-top">
        <Receipt title="YOUR PLAN" lines={[
          { label: "Groceries", sub: "T-24h", amount: "₹280", stamped: true },
          { label: "Cleaning x3", sub: "T-12h", amount: "₹480", stamped: true, delay: 150 },
          { label: "Wardrobe", sub: "T-6h", amount: "₹520", stamped: true, delay: 300 },
          { label: "Decoration", sub: "T-3h", amount: "₹720", stamped: true, delay: 450 },
          { label: "Fees", sub: "platform + coordination", amount: "₹180" },
        ]} total="₹2,180" stamp={<Stamp thump>APPROVED</Stamp>} />
      </div>
    );
  if (step === 3)
    return (
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-euca">Live</p>
        <PulseMap />
        <div className="mt-2 rounded-xl bg-white p-3 text-sm"><b>Rahul</b> Gate 2 par hai, lagbhag <b>6 min</b>.<br /><span className="text-euca">Tower C, 9th floor</span></div>
        <div className="mt-2 flex items-center justify-between rounded-xl bg-tide p-3 text-cream"><span className="text-xs">Door OTP</span><span className="font-mono text-2xl tracking-[0.3em]">4821</span></div>
      </div>
    );
  return (
    <div className="grid place-items-center text-center">
      <Ring percent={100} size={150} label="ghar ready" sub="Aap bas aaiye" />
      <div className="sticky-note mt-4 -rotate-2 p-4 text-left">
        <p className="hand text-2xl leading-tight">Rahul bhaiya, ghar bahut sundar laga. Shukriya!</p>
        <p className="hand mt-1 text-right text-lg">- Meera, Tower C</p>
      </div>
    </div>
  );
}

const STEPS = [
  { t: "Bas likh do", d: "Hindi, English ya Hinglish. Text, voice ya photo, jo aasan lage.", h: "1. Message" },
  { t: "Do chhote sawaal", d: "Chips par tap karo. Paanch se zyada sawaal kabhi nahi.", h: "2. Sawaal" },
  { t: "Ek receipt, ek plan", d: "Ek insaan check karta hai, phir price, time aur helper dikhte hain.", h: "3. Plan" },
  { t: "Dekho kaun aa raha hai", d: "Gate se tower tak, lift ke saath. Door OTP sirf helper ko.", h: "4. Live" },
  { t: "Ghar ready", d: "Before-after dekho, ek Shell Note bhejo, aur bas.", h: "5. Done" },
];

export function PinnedStory() {
  const wrap = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(0.999, -r.top / (r.height - innerHeight)));
      setStep(Math.floor(p * 5));
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      {/* Desktop: pinned */}
      <div ref={wrap} className="relative hidden md:block" style={{ height: "420vh" }}>
        <div className="sticky top-0 grid h-screen grid-cols-[1fr_auto] items-center gap-16 px-10">
          <div className="max-w-lg">
            <p className="hand -rotate-2 text-3xl text-sand">Ek message. Ek result.</p>
            <h2 className="font-display mt-2 text-6xl font-black leading-[0.95]">One message,<br /><span className="font-accent text-sun">one</span> result.</h2>
            <div className="mt-10 flex gap-4">
              <ol className="flex flex-col items-center gap-3" aria-hidden="true">
                {STEPS.map((_, i) => <li key={i} className={`h-3 w-3 rounded-full transition-all ${i === step ? "scale-150 bg-sun" : "bg-sage/50"}`} />)}
              </ol>
              <div key={step} className="slidein">
                <p className="font-mono text-xs uppercase tracking-widest text-sage">{STEPS[step].h}</p>
                <p className="font-display mt-1 text-3xl font-bold leading-tight">{STEPS[step].t}</p>
                <p className="mt-2 text-lg text-cream/80">{STEPS[step].d}</p>
              </div>
            </div>
          </div>
          <div className="-rotate-2"><Phone><div key={step} className="flip"><Screen step={step} /></div></Phone></div>
        </div>
      </div>
      {/* Mobile: vertical cards with dot rail */}
      <div className="relative px-5 pb-4 md:hidden">
        <div className="absolute bottom-0 left-[1.65rem] top-0 w-0 border-l-2 border-dashed border-sage/50" aria-hidden="true" />
        <p className="hand -rotate-2 pl-8 text-2xl text-sand">Ek message. Ek result.</p>
        <h2 className="font-display mt-1 pl-8 text-4xl font-black leading-none">One message, <span className="font-accent text-sun">one</span> result.</h2>
        {STEPS.map((s, i) => (
          <div key={s.t} className="relative mt-8 pl-8">
            <span className="absolute left-[0.35rem] top-2 h-4 w-4 rounded-full bg-sun ring-4 ring-forest" aria-hidden="true" />
            <p className="font-mono text-xs uppercase tracking-widest text-sage">{s.h}</p>
            <p className="font-display text-2xl font-bold">{s.t}</p>
            <p className="mb-4 mt-1 text-cream/80">{s.d}</p>
            <Reveal><Phone><Screen step={i} /></Phone></Reveal>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- H4: four jobs, one bill ---------- */
export function FourJobs() {
  const [mode, setMode] = useState<"before" | "after">("before");
  const threads = [
    { n: "Safai wali didi", m: "Kal aaungi... 12 baje?", p: "₹600", c: 3 },
    { n: "Grocery app", m: "Order delayed, 2 items out", p: "₹349 + ₹49", c: 2 },
    { n: "Decor wala", m: "Balloon ka rate badh gaya", p: "₹1,800", c: 5 },
    { n: "Tuition group", m: "Sir ne kaha Excel bhi aata hai", p: "₹500", c: 1 },
  ];
  return (
    <div>
      <div className="mx-auto flex w-fit gap-1 rounded-full bg-tide/10 p-1" role="tablist" aria-label="Compare">
        <button role="tab" aria-selected={mode === "before"} onClick={() => setMode("before")} className={`rounded-full px-5 py-2 font-semibold ${mode === "before" ? "bg-tide text-cream" : ""}`}>Aaj</button>
        <button role="tab" aria-selected={mode === "after"} onClick={() => setMode("after")} className={`rounded-full px-5 py-2 font-semibold ${mode === "after" ? "bg-tide text-cream" : ""}`}>Shell ke saath</button>
      </div>
      <div key={mode} className="flip mx-auto mt-8 max-w-md [perspective:1000px]">
        {mode === "before" ? (
          <Phone>
            <p className="font-mono text-[10px] uppercase tracking-widest text-stamp">4 chats · 4 prices</p>
            <ul className="mt-2 space-y-2">
              {threads.map((t, i) => (
                <li key={t.n} className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-xs" style={{ transform: `rotate(${i % 2 ? 1 : -1}deg)` }}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand font-bold">{t.n[0]}</span>
                  <span className="min-w-0 flex-1"><b className="block">{t.n}</b><span className="block truncate opacity-70">{t.m}</span></span>
                  <span className="text-right"><span className="block font-mono font-bold">{t.p}</span><span className="inline-grid h-5 w-5 place-items-center rounded-full bg-stamp text-[10px] font-bold text-white">{t.c}</span></span>
                </li>
              ))}
            </ul>
            <p className="hand mt-3 text-center text-xl text-stamp">Kaun kya karega? Kisko kitna dena hai?</p>
          </Phone>
        ) : (
          <Phone>
            <p className="font-mono text-[10px] uppercase tracking-widest text-euca">1 message · 1 receipt</p>
            <div className="-mx-1 mt-1 scale-[0.93] origin-top">
              <Receipt title="SHELL RECEIPT" lines={[
                { label: "Cleaning", amount: "₹480", stamped: true },
                { label: "Groceries", amount: "₹280", stamped: true },
                { label: "Decoration", amount: "₹720", stamped: true },
                { label: "Excel help", amount: "₹400", stamped: true },
              ]} total="₹2,140" foot="Ek insaan se poochho: Shell." />
            </div>
          </Phone>
        )}
      </div>
      <ul className="mx-auto mt-10 grid max-w-3xl gap-4 text-center sm:grid-cols-3">
        {[["one point of contact", "chat"], ["one payment", "rupee"], ["one guarantee", "shield"]].map(([t, ic], i) => (
          <li key={t} className="rounded-3xl bg-paper p-4 shadow-[0_6px_0_rgba(5,31,32,0.15)]" style={{ transform: `rotate(${[-1.5, 1, -0.6][i]}deg)` }}>
            <Icon name={ic} size={34} className="mx-auto" />
            <p className="font-display mt-1 text-xl font-bold">{t}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
