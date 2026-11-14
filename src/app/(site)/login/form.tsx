"use client";
import { useEffect, useState } from "react";
import { post } from "@/components/client";

export function LoginForm({ next, as }: { next?: string; as?: string }) {
  const [phone, setPhone] = useState(""); const [code, setCode] = useState(""); const [step, setStep] = useState<"phone" | "code">("phone");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [hint, setHint] = useState(""); const [wait, setWait] = useState(0);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);
  async function send() {
    setErr(""); setBusy(true);
    try { const d = await post<{ demoCode?: string }>("/api/auth/otp/request", { phone }); setStep("code"); setWait(30); setHint(d.demoCode ? `Demo mode: your code is ${d.demoCode}` : "Code sent on WhatsApp."); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  async function verify() {
    setErr(""); setBusy(true);
    try { const d = await post<{ next: string; isNew: boolean }>("/api/auth/otp/verify", { phone, code, as }); window.location.href = d.isNew && !next ? d.next : next || d.next; } catch (e) { setErr((e as Error).message); setBusy(false); }
  }
  return (
    <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); step === "phone" ? send() : verify(); }}>
      <div><label className="label" htmlFor="phone">Mobile number</label>
        <div className="flex gap-2"><span className="grid w-14 place-items-center rounded-xl border-[1.5px] border-line bg-bone text-sm font-semibold">+91</span><input id="phone" className="input" inputMode="tel" autoComplete="tel" placeholder="98100 00000" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={step === "code"} autoFocus /></div></div>
      {step === "code" && <div><label className="label" htmlFor="code">6-digit code</label><input id="code" className="input tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />
        <div className="mt-1 flex items-center justify-between text-xs"><span className="text-euca">{hint}</span><button type="button" className="font-semibold underline disabled:no-underline disabled:opacity-50" disabled={wait > 0} onClick={send}>{wait > 0 ? `Resend in ${wait}s` : "Resend code"}</button></div></div>}
      {err && <p role="alert" className="rounded-lg bg-[#f8dcd8] p-2 text-sm text-danger">{err}</p>}
      <button className="btn btn-primary w-full" disabled={busy || (step === "code" && code.length < 6)}>{busy ? "Please wait…" : step === "phone" ? "Send code" : "Sign in"}</button>
      <p className="text-xs text-ink/50">By continuing you agree to our Terms and Privacy Policy.</p>
    </form>
  );
}

export function DemoLogin({ next }: { next?: string }) {
  const [busy, setBusy] = useState("");
  const go = async (role: string) => { setBusy(role); try { const d = await post<{ next: string }>("/api/auth/demo", { role }); window.location.href = d.next; } catch { setBusy(""); } void next; };
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {[["customer", "Customer (Anika)"], ["helper", "Helper (Rahul)"], ["ops", "Ops team"], ["society", "Society partner"]].map(([r, l]) => <button key={r} className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => go(r)}>{busy === r ? "Opening…" : l}</button>)}
    </div>
  );
}
