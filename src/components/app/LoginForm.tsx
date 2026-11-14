"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/Icon";
import { track } from "@/lib/analytics";

/** Splash + language + phone OTP (WhatsApp first, SMS fallback). Resend after 30 s, lock for 10 min after 3 wrong tries. */
export function LoginForm({ role = "CUSTOMER", title }: { role?: "CUSTOMER" | "HELPER"; title: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"lang" | "phone" | "otp">(role === "CUSTOMER" ? "lang" : "phone");
  const [lang, setLang] = useState("hinglish");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [dev, setDev] = useState<string>();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [timer, setTimer] = useState(0);
  useEffect(() => { if (timer <= 0) return; const id = setTimeout(() => setTimer(timer - 1), 1000); return () => clearTimeout(id); }, [timer]);
  useEffect(() => {
    if (step !== "otp" || !("OTPCredential" in window)) return;
    const ac = new AbortController();
    (navigator.credentials as any).get({ otp: { transport: ["sms"] }, signal: ac.signal }).then((o: { code?: string } | null) => o?.code && setCode(o.code)).catch(() => {});
    return () => ac.abort();
  }, [step]);
  const post = async (url: string, body: unknown) => { const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message ?? "Kuch gadbad ho gayi"); return j; };
  const pick = (l: string) => { setLang(l); document.cookie = `shell_lang=${l}; path=/; max-age=31536000`; setStep("phone"); };
  const send = async () => { setErr(""); setBusy(true); try { const j = await post("/api/auth/request", { phone, role }); setDev(j.devCode); setStep("otp"); setTimer(30); track("signup_started"); } catch (e) { setErr((e as Error).message); } setBusy(false); };
  const verify = async () => { setErr(""); setBusy(true); try { const j = await post("/api/auth/verify", { phone, code, role, name: name || undefined, language: lang }); track("otp_verified"); router.push(j.redirect); router.refresh(); } catch (e) { setErr((e as Error).message); } setBusy(false); };
  return (
    <main id="main" className="mx-auto grid min-h-screen max-w-md content-center gap-6 px-5 py-10">
      <div className="text-forest"><Wordmark size={44} /></div>
      <h1 className="display text-4xl">{title}</h1>
      {step === "lang" && (
        <div className="grid gap-3" role="group" aria-label="Choose language">
          {[["en", "English", "Continue in English"], ["hi", "हिंदी", "हिंदी में आगे बढ़ें"], ["hinglish", "Hinglish", "Hinglish mein chalo"]].map(([v, l, s], i) => (
            <button key={v} onClick={() => pick(v)} className="rounded-2xl border-2 border-ink bg-paper p-4 text-left shadow-[4px_4px_0_var(--color-ink)] active:translate-y-1" style={{ transform: `rotate(${[-1, 0.8, -0.5][i]}deg)` }}><b className="display text-2xl">{l}</b><span className="block text-sm">{s}</span></button>
          ))}
        </div>
      )}
      {step === "phone" && (
        <div className="grid gap-4">
          {role === "HELPER" && <div><label htmlFor="nm" className="mono text-xs uppercase">Naam (new helpers)</label><input id="nm" className="field" value={name} onChange={(e) => setName(e.target.value)} /></div>}
          <div><label htmlFor="ph" className="mono text-xs uppercase">Mobile number</label><div className="flex gap-2"><span className="field !w-16 text-center">+91</span><input id="ph" className="field" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} /></div></div>
          <button className="btn btn-sun" disabled={phone.length !== 10 || busy} onClick={send}>WhatsApp pe OTP bhejo</button>
          <p className="text-xs opacity-70">OTP pehle WhatsApp par aayega, na aaye to SMS.</p>
        </div>
      )}
      {step === "otp" && (
        <div className="grid gap-4">
          <div><label htmlFor="otp" className="mono text-xs uppercase">6-digit OTP</label><input id="otp" className="field mono text-2xl tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} onPaste={(e) => { const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (t) { e.preventDefault(); setCode(t); } }} />{dev && <p className="mt-1 text-xs">Demo mode OTP: <b className="mono">{dev}</b></p>}</div>
          <button className="btn btn-sun" disabled={code.length !== 6 || busy} onClick={verify}>Aage badho</button>
          <button className="link-quiet text-sm font-bold disabled:opacity-50" disabled={timer > 0} onClick={send}>{timer > 0 ? `Resend in ${timer}s` : "OTP dobara bhejo"}</button>
        </div>
      )}
      {err && <p role="alert" className="rounded-xl bg-brick/10 p-3 text-sm font-semibold text-brick">{err}</p>}
      <p className="mono text-xs opacity-60">Demo logins: 9999900001 (customer) · 9999900002 (ops) · 9100000001 (helper). OTP 123456.</p>
    </main>
  );
}
