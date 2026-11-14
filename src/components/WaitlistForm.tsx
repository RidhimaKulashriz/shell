"use client";

import { useEffect, useRef, useState } from "react";
import { Meter, Ring, Stamp } from "./ui";
import { track } from "@/lib/track";
import { SITE_URL } from "@/lib/site";

type Soc = { id: string; slug?: string; name: string; area: string; waiting: number; unlockTarget: number; status: string };
type Result = { name: string; position: number; referralCode: string; referrals: number; existing?: boolean; society: { name: string; waiting: number; target: number } | null };

const inputCls = "w-full rounded-xl border-2 border-tide/30 bg-white/70 px-4 py-3 text-base outline-none focus:border-euca focus:bg-white";

export function WaitlistForm({ prefill = "", compact = false }: { prefill?: string; compact?: boolean }) {
  const [socs, setSocs] = useState<Soc[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"help" | "earn" | "both">("help");
  const [societyQ, setSocietyQ] = useState("");
  const [societyId, setSocietyId] = useState<string | null>(null);
  const [tower, setTower] = useState("");
  const [message, setMessage] = useState(prefill);
  const [referral, setReferral] = useState("");
  const [consent, setConsent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Result | null>(null);
  const started = useRef(false);

  useEffect(() => {
    fetch("/api/waitlist/stats").then((r) => r.json()).then((j) => {
      setSocs(j.societies ?? []);
      const want = new URLSearchParams(location.search).get("society");
      const hit = (j.societies ?? []).find((s: Soc) => s.slug === want);
      if (hit) { setSocietyId(hit.id); setSocietyQ(`${hit.name}, ${hit.area}`); }
    }).catch(() => {});
    const q = new URLSearchParams(location.search);
    if (q.get("ref")) setReferral(q.get("ref")!.toUpperCase());
    if (q.get("msg")) setMessage(q.get("msg")!);
    if (q.get("role") === "earn") setRole("earn");
    try {
      const saved = sessionStorage.getItem("shell_demo_text");
      if (saved && !q.get("msg") && !prefill) setMessage(saved);
    } catch {}
  }, [prefill]);
  useEffect(() => {
    if (prefill) setMessage(prefill);
  }, [prefill]);
  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const start = () => {
    if (!started.current) {
      started.current = true;
      track("form_start", { form: "waitlist" });
    }
  };
  const fail = (m: string) => {
    setErr(m);
    track("form_error", { form: "waitlist", message: m });
  };

  const matched = socs.filter((s) => societyQ.length > 0 && `${s.name} ${s.area}`.toLowerCase().includes(societyQ.toLowerCase()));

  async function sendOtp() {
    setErr(null);
    if (name.trim().length < 2) return fail("Naam daalo.");
    if (!/^(\+?91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) return fail("10 digit ka Indian mobile number daalo.");
    if (!consent) return fail("WhatsApp messages ke liye tick karna zaroori hai.");
    setBusy(true);
    const r = await fetch("/api/waitlist/otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return fail(j?.error?.hi ?? "Kuch gadbad hui. Dobara try karo.");
    setOtpSent(true);
    setTimer(30);
    setDevCode(j.devCode ?? null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!otpSent) return sendOtp();
    setErr(null);
    if (!/^\d{6}$/.test(otp)) return fail("6 digit ka OTP daalo.");
    setBusy(true);
    const r = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, phone, otp, role, societyId, societyText: societyId ? null : societyQ, towerText: tower || null, message: message || null, referral: referral || null, consent }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return fail(j?.error?.hi ?? "Kuch gadbad hui. Dobara try karo.");
    track("form_submit", { form: "waitlist", role });
    track("waitlist_submitted", { role });
    setDone(j);
    try {
      navigator.vibrate?.(30);
    } catch {}
  }

  if (done) {
    const link = `${SITE_URL}/waitlist?ref=${done.referralCode}`;
    const card = `/api/og?title=${encodeURIComponent(done.name.split(" ")[0] + " is on the Shell list")}&sub=${encodeURIComponent(done.society?.name ?? "Delhi")}&n=${done.position}`;
    const share = `https://wa.me/?text=${encodeURIComponent(`Main Shell ki waitlist mein #${done.position} hoon. Tum bhi judo, society mein jaldi aayega: ${link}`)}`;
    const pct = done.society ? Math.min(100, (done.society.waiting / done.society.target) * 100) : 0;
    return (
      <div className="receipt scallop relative mx-auto max-w-lg px-6 pb-12 pt-6" aria-live="polite">
        <div className="flex justify-between text-[11px] tracking-[0.2em]"><span>SHELL WAITLIST</span><span>{done.existing ? "ALREADY IN" : "NEW"}</span></div>
        <hr className="perf my-3" />
        <div className="relative">
          <p className="font-display text-4xl font-bold leading-tight">{done.existing ? "Aap pehle se list mein ho." : "You're in."} <span className="font-mono text-3xl">#<Meter value={done.position} /></span></p>
          <div className="absolute -top-2 right-0"><Stamp thump>{done.existing ? "VERIFIED" : "PAID IN"}</Stamp></div>
        </div>
        <p className="mt-2 text-sm">Shukriya, {done.name.split(" ")[0]}. Double opt-in ke liye WhatsApp par ek confirm message aayega.</p>
        {done.society ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs"><span>{done.society.name}</span><span>{done.society.waiting} / {done.society.target} neighbours</span></div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-tide/15"><div className="h-full rounded-full bg-euca" style={{ width: `${Math.max(3, pct)}%`, transition: "width 1s" }} /></div>
          </div>
        ) : null}
        <hr className="perf my-4" />
        <p className="text-xs uppercase tracking-widest">Aapka referral link</p>
        <div className="mt-1 flex items-center gap-2">
          <input readOnly value={link} className={`${inputCls} !py-2 font-mono text-xs`} onFocus={(e) => e.currentTarget.select()} aria-label="Referral link" />
          <button className="pill pill-forest !px-3 !py-2 text-xs" onClick={() => { navigator.clipboard?.writeText(link); track("referral_link_shared", { via: "copy" }); }}>Copy</button>
        </div>
        <p className="mt-2 text-xs opacity-70">Har verified dost aapko {3} jagah aage le jata hai, aur launch par ek credit milta hai.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="pill pill-sun text-sm" href={share} target="_blank" rel="noopener noreferrer" onClick={() => track("referral_link_shared", { via: "whatsapp" })}>WhatsApp par bhejo</a>
          <a className="pill pill-line text-sm" href={card} target="_blank" rel="noopener noreferrer" download>Share card</a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} onFocus={start} className={`receipt scallop relative mx-auto px-5 pb-10 pt-6 md:px-8 ${compact ? "max-w-xl" : "max-w-2xl"}`} noValidate aria-label="Join the Shell waitlist">
      <div className="flex justify-between text-[11px] tracking-[0.2em]"><span>SHELL WAITLIST</span><span>FORM 01</span></div>
      <hr className="perf my-3" />
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-full bg-tide/10 p-1 text-sm font-semibold" role="radiogroup" aria-label="I want">
        {([["help", "Mujhe help chahiye"], ["earn", "Mujhe kamana hai"], ["both", "Dono"]] as const).map(([v, l]) => (
          <button type="button" key={v} role="radio" aria-checked={role === v} onClick={() => setRole(v)} className={`rounded-full px-2 py-2 text-[0.8rem] leading-tight ${role === v ? "bg-tide text-cream shadow" : ""}`}>{l}</button>
        ))}
      </div>
      <div className="grid gap-3 font-sans md:grid-cols-2">
        <label className="block text-sm font-medium">Naam
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </label>
        <label className="block text-sm font-medium">WhatsApp number
          <div className="flex">
            <span className="grid place-items-center rounded-l-xl border-2 border-r-0 border-tide/30 bg-tide/10 px-3 font-mono text-sm">+91</span>
            <input className={`${inputCls} !rounded-l-none`} inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel-national" placeholder="98xxxxxxxx" required disabled={otpSent} />
          </div>
        </label>
        <div className="relative md:col-span-2">
          <label className="block text-sm font-medium">Society ya area
            <input className={inputCls} value={societyQ} onChange={(e) => { setSocietyQ(e.target.value); setSocietyId(null); }} placeholder="Apni society dhundo" autoComplete="off" />
          </label>
          {matched.length > 0 && !societyId ? (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border-2 border-tide bg-paper shadow-lg" role="listbox">
              {matched.map((s) => (
                <li key={s.id}><button type="button" role="option" aria-selected={false} className="block w-full px-4 py-2 text-left text-sm hover:bg-sage/30" onClick={() => { setSocietyId(s.id); setSocietyQ(`${s.name}, ${s.area}`); }}>{s.name} <span className="opacity-60">· {s.area}</span></button></li>
              ))}
            </ul>
          ) : null}
          {societyQ.length > 2 && !societyId && matched.length === 0 ? <p className="mt-1 text-xs opacity-70">Aapki society list mein nahi hai? Koi baat nahi, hum use &ldquo;{societyQ}&rdquo; ke naam se likh lenge.</p> : null}
        </div>
        <label className="block text-sm font-medium">Tower (optional)
          <input className={inputCls} value={tower} onChange={(e) => setTower(e.target.value)} placeholder="Tower C" />
        </label>
        <label className="block text-sm font-medium">Referral code
          <input className={`${inputCls} font-mono uppercase`} value={referral} onChange={(e) => setReferral(e.target.value)} maxLength={12} />
        </label>
        <label className="block text-sm font-medium md:col-span-2">Kya karwana hai?
          <textarea className={inputCls} rows={2} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={600} placeholder="Jaise: weekend pe ghar saaf, groceries, wardrobe" />
        </label>
        <label className="flex items-start gap-2 text-sm md:col-span-2">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Haan, Shell mujhe WhatsApp par waitlist ke updates bhej sakta hai. Main kabhi bhi STOP likh kar band kar sakta/sakti hoon.</span>
        </label>
        {otpSent ? (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">6 digit OTP, {phone} par bheja
              <input className={`${inputCls} font-mono text-xl tracking-[0.5em]`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} autoFocus />
            </label>
            {devCode ? <p className="mt-1 rounded-lg bg-sand/50 px-3 py-1.5 font-mono text-xs">Demo mode: SMS provider connected nahi hai. Aapka code: <b>{devCode}</b></p> : null}
            <div className="mt-1 text-xs">
              {timer > 0 ? `Dobara bhejne ke liye ${timer}s` : <button type="button" className="underline" onClick={sendOtp}>OTP dobara bhejo</button>}
              {" · "}
              <button type="button" className="underline" onClick={() => { setOtpSent(false); setOtp(""); }}>Number badlo</button>
            </div>
          </div>
        ) : null}
      </div>
      {err ? <p role="alert" className="mt-3 rounded-lg bg-stamp/10 px-3 py-2 text-sm font-medium text-stamp">{err}</p> : null}
      <button className="pill pill-sun mt-5 w-full justify-center" disabled={busy} data-cta="waitlist_submit">
        {busy ? "Ek second..." : otpSent ? "Verify karke list mein judo" : "OTP bhejo"}
      </button>
      <p className="mt-3 text-center text-[11px] opacity-60">Hum aapka number kisi ko nahi bechte. <a className="underline" href="/legal/privacy">Privacy</a></p>
      <div className="mt-4 hidden justify-center md:flex"><Ring percent={otpSent ? 66 : 33} size={64} label="form" /></div>
    </form>
  );
}
