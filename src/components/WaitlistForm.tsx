"use client";
import { useEffect, useRef, useState } from "react";
import { Stamp } from "@/components/ui";
import { track } from "@/lib/analytics";

type Result = { position: number; neighbours: number; referralCode: string; shareUrl: string; cardUrl: string; existing?: boolean };

/** Receipt-styled waitlist form. WhatsApp OTP verified, one signup per number, referral aware. */
export function WaitlistForm({ societies, initialText = "", refCode = "", initialSociety = "", light = true }: { societies: string[]; initialText?: string; refCode?: string; initialSociety?: string; light?: boolean }) {
  const [f, setF] = useState({ name: "", phone: "", otp: "", role: "help", society: initialSociety, tower: "", message: initialText, ref: refCode, consent: false });
  const [otpSent, setOtpSent] = useState(false);
  const [dev, setDev] = useState<string | undefined>();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  useEffect(() => setF((x) => ({ ...x, message: x.message || initialText })), [initialText]);
  const set = (k: string, v: string | boolean) => {
    if (!started.current) { started.current = true; track("form_start", { form: "waitlist" }); }
    setF((x) => ({ ...x, [k]: v }));
  };
  const post = async (url: string, data: unknown) => {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message ?? "Something went wrong. Please try again.");
    return j;
  };
  const sendOtp = async () => {
    setErr(""); setBusy(true);
    try {
      const j = await post("/api/waitlist/otp", { phone: f.phone });
      setOtpSent(true); setDev(j.devCode);
    } catch (e) { setErr((e as Error).message); track("form_error", { form: "waitlist", step: "otp" }); }
    setBusy(false);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const j = await post("/api/waitlist", { ...f, ref: f.ref || undefined, tower: f.tower || undefined, message: f.message || undefined });
      setRes(j);
      track("form_submit", { form: "waitlist" }); track("waitlist_submitted", { role: f.role });
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (e) { setErr((e as Error).message); track("form_error", { form: "waitlist" }); }
    setBusy(false);
  };
  const L = (id: string, label: string) => <label htmlFor={id} className="mono mb-1 block text-xs uppercase tracking-wider opacity-70">{label}</label>;

  if (res)
    return (
      <div className="receipt scallop-b mx-auto max-w-md text-ink">
        <div className="text-center">
          <div className="mono text-xs tracking-widest opacity-60">SHELL WAITLIST RECEIPT</div>
          <div className="my-6 flex justify-center"><Stamp large tone="brick" label={`You're in. #${res.position}`} rot={-7} /></div>
          <p className="display text-2xl">{res.existing ? "You are already on the list." : "Thank you. You are on the list."}</p>
          <div className="perf" />
          <div className="receipt-line"><span>Queue position</span><span className="leader" /><b>#{res.position}</b></div>
          <div className="receipt-line"><span>Neighbours in your area</span><span className="leader" /><b>{res.neighbours}</b></div>
          <div className="receipt-line"><span>Your referral code</span><span className="leader" /><b>{res.referralCode}</b></div>
          <div className="perf" />
          <p className="text-sm">Every friend who joins moves you up 5 places and earns you a credit at launch.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a className="btn btn-forest btn-sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`I'm #${res.position} on the Shell list. Join me: ${res.shareUrl}`)}`} onClick={() => track("referral_link_shared", { via: "whatsapp" })}>Share on WhatsApp</a>
            <button className="btn btn-cream btn-sm" onClick={() => { navigator.clipboard?.writeText(res.shareUrl); setCopied(true); track("referral_link_shared", { via: "copy" }); }}>{copied ? "Copied" : "Copy link"}</button>
            <a className="btn btn-ghost btn-sm" href={res.cardUrl} target="_blank" rel="noopener noreferrer">Share card</a>
          </div>
        </div>
      </div>
    );

  return (
    <form onSubmit={submit} className={`receipt scallop-b mx-auto w-full max-w-lg !text-[14px] ${light ? "" : ""}`} noValidate>
      <div className="mono text-xs tracking-widest opacity-60">SHELL WAITLIST / FORM NO. 001</div>
      <div className="perf" />
      <div className="grid gap-4">
        <div role="radiogroup" aria-label="What do you want" className="grid grid-cols-3 gap-2">
          {[["help", "I want help"], ["earn", "I want to earn"], ["both", "Both"]].map(([v, l]) => (
            <button type="button" key={v} role="radio" aria-checked={f.role === v} onClick={() => set("role", v)} className={`rounded-xl border border-ink/20 px-2 py-2 text-sm font-bold ${f.role === v ? "bg-forest text-cream" : "bg-cream"}`}>{l}</button>
          ))}
        </div>
        <div>{L("wl-name", "Naam / Name")}<input id="wl-name" className="field" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" required /></div>
        <div>
          {L("wl-phone", "WhatsApp number")}
          <div className="flex gap-2"><span className="field !w-16 text-center">+91</span><input id="wl-phone" className="field" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={f.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} required /><button type="button" className="btn btn-forest btn-sm shrink-0" disabled={f.phone.length !== 10 || busy} onClick={sendOtp}>{otpSent ? "Resend" : "Send OTP"}</button></div>
        </div>
        {otpSent && <div>{L("wl-otp", "6-digit OTP")}<input id="wl-otp" className="field mono tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={f.otp} onChange={(e) => set("otp", e.target.value.replace(/\D/g, ""))} />{dev && <p className="mt-1 text-xs">Demo mode: OTP is <b className="mono">{dev}</b></p>}</div>}
        <div>
          {L("wl-soc", "Society ya area")}
          <input id="wl-soc" list="soc-list" className="field" value={f.society} onChange={(e) => set("society", e.target.value)} placeholder="Start typing your society" />
          <datalist id="soc-list">{societies.map((s) => <option key={s} value={s} />)}</datalist>
          <p className="mt-1 text-xs opacity-70">Society not listed? Type its name and we will add it.</p>
        </div>
        <div>{L("wl-tower", "Tower (optional)")}<input id="wl-tower" className="field" value={f.tower} onChange={(e) => set("tower", e.target.value)} /></div>
        <div>{L("wl-msg", "What do you need done?")}<textarea id="wl-msg" className="field min-h-[84px]" value={f.message} onChange={(e) => set("message", e.target.value)} placeholder="Guests are coming tomorrow. I need cleaning, groceries..." /></div>
        <div>{L("wl-ref", "Referral code (optional)")}<input id="wl-ref" className="field mono uppercase" value={f.ref} onChange={(e) => set("ref", e.target.value)} maxLength={20} /></div>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} /> <span>I agree to receive Shell updates on WhatsApp. I can opt out at any time.</span></label>
        {err && <p role="alert" className="rounded-xl bg-brick/10 p-2 text-sm font-semibold text-brick">{err}</p>}
        <button type="submit" className="btn btn-sun w-full" disabled={busy || !f.consent || !f.name || f.phone.length !== 10 || f.otp.length !== 6}>{busy ? "One moment..." : "Join the waitlist"}</button>
      </div>
    </form>
  );
}
