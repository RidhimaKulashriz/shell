"use client";

import { useRef, useState } from "react";
import { Stamp } from "./ui";
import { track } from "@/lib/track";

const inputCls = "w-full rounded-xl border-2 border-tide/30 bg-white/70 px-4 py-3 text-base outline-none focus:border-euca focus:bg-white";

type Kind = "contact" | "rwa" | "office" | "hostel";

export function EnquiryForm({ kind, className = "" }: { kind: Kind; className?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);
  const started = useRef(false);
  const isContact = kind === "contact";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries());
    setState("busy");
    const body = isContact
      ? { kind: "contact", name: fd.name, email: fd.email, phone: fd.phone, topic: fd.topic, message: fd.message }
      : { kind, orgName: fd.orgName, city: fd.city, size: fd.size ? Number(fd.size) : undefined, contactName: fd.contactName, contactRole: fd.contactRole, phone: fd.phone, callTime: fd.callTime, notes: fd.notes };
    const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setState("idle");
      const m = j?.error?.hi ?? "Kuch gadbad hui. Dobara try karo.";
      setErr(m);
      track("form_error", { form: kind, message: m });
      return;
    }
    track("form_submit", { form: kind });
    setState("done");
  }

  if (state === "done") {
    return (
      <div className={`receipt scallop relative px-6 pb-12 pt-6 ${className}`} role="status">
        <p className="font-display text-3xl font-bold">Mil gaya. Shukriya.</p>
        <p className="mt-2 text-sm">Hum 1 working day mein WhatsApp ya phone par reply karenge.</p>
        <div className="absolute right-4 top-4"><Stamp thump>RECEIVED</Stamp></div>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} onFocus={() => { if (!started.current) { started.current = true; track("form_start", { form: kind }); } }} className={`receipt scallop px-5 pb-10 pt-6 md:px-7 ${className}`} noValidate>
      <div className="flex justify-between text-[11px] tracking-[0.2em]"><span>{isContact ? "SAY HELLO" : kind === "rwa" ? "SOCIETY ENQUIRY" : "BULK ENQUIRY"}</span><span>FORM</span></div>
      <hr className="perf my-3" />
      <div className="grid gap-3 font-sans md:grid-cols-2">
        {isContact ? (
          <>
            <label className="block text-sm font-medium">Naam<input name="name" className={inputCls} required autoComplete="name" /></label>
            <label className="block text-sm font-medium">Email<input name="email" type="email" className={inputCls} autoComplete="email" /></label>
            <label className="block text-sm font-medium">Phone (optional)<input name="phone" inputMode="tel" className={inputCls} autoComplete="tel" /></label>
            <label className="block text-sm font-medium">Kis baare mein
              <select name="topic" className={inputCls} defaultValue="general"><option value="general">General</option><option value="safety">Safety concern</option><option value="helper">Helper banna hai</option><option value="society">Society / RWA</option><option value="press">Press</option><option value="other">Other</option></select>
            </label>
            <label className="block text-sm font-medium md:col-span-2">Message<textarea name="message" rows={4} className={inputCls} required minLength={5} /></label>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium">{kind === "rwa" ? "Society ka naam" : kind === "hostel" ? "Hostel ka naam" : "Office / company"}<input name="orgName" className={inputCls} required /></label>
            <label className="block text-sm font-medium">City<input name="city" className={inputCls} defaultValue="Delhi" /></label>
            <label className="block text-sm font-medium">{kind === "rwa" ? "Kitne flats" : "Kitne log"}<input name="size" type="number" min={1} className={inputCls} inputMode="numeric" /></label>
            <label className="block text-sm font-medium">Aapka naam<input name="contactName" className={inputCls} required autoComplete="name" /></label>
            <label className="block text-sm font-medium">Aapka role<input name="contactRole" className={inputCls} placeholder={kind === "rwa" ? "President, secretary..." : "Manager, warden..."} /></label>
            <label className="block text-sm font-medium">WhatsApp number<input name="phone" className={inputCls} inputMode="tel" required autoComplete="tel" /></label>
            <label className="block text-sm font-medium md:col-span-2">Call ka best time<input name="callTime" className={inputCls} placeholder="Shaam 6 se 8" /></label>
            <label className="block text-sm font-medium md:col-span-2">Kuch aur batana ho<textarea name="notes" rows={2} className={inputCls} /></label>
          </>
        )}
      </div>
      {err ? <p role="alert" className="mt-3 rounded-lg bg-stamp/10 px-3 py-2 text-sm font-medium text-stamp">{err}</p> : null}
      <button className="pill pill-sun mt-5 w-full justify-center" disabled={state === "busy"}>{state === "busy" ? "Bhej rahe hain..." : "Bhejo"}</button>
    </form>
  );
}
