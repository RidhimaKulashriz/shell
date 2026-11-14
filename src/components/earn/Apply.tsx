"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

const STEPS = ["Basics", "Government ID", "College ID", "Selfie check", "Skills", "Availability", "Payout and agreement"];
const CATS = [["house-cleaning", "Cleaning"], ["utensils", "Utensils"], ["groceries", "Groceries"], ["errands", "Errands"], ["parcel-pickup", "Parcels"], ["wardrobe-organising", "Wardrobe"], ["decoration", "Decoration"], ["event-help", "Event help"], ["excel-data-help", "Excel"], ["tutoring", "Explaining"], ["pet-walking", "Pet walks"], ["queueing", "Queueing"], ["sports-partner", "Sports"], ["gaming-partner", "Gaming"]];
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const BLOCKS: Record<string, number[]> = { Morning: [7, 8, 9, 10, 11], Afternoon: [12, 13, 14, 15, 16], Evening: [17, 18, 19, 20] };

async function shrink(f: File): Promise<string> {
  const img = await createImageBitmap(f); const s = Math.min(1, 800 / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s; c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", 0.6);
}

export function Apply({ startStep, status, name }: { startStep: number; status: string; name: string }) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(7, startStep + 1));
  const [done, setDone] = useState(startStep >= 7);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<any>({ name, dob: "", gender: "female", college: "", languages: ["Hindi"], kycConsent: false, cats: [] as { slug: string; level: number }[], voiceIntro: "", grid: {} as Record<string, string[]>, hours: 8, radius: 1500, upi: "", agree: false, safety: false, front: "", back: "", selfie: "" });
  const [scrolled, setScrolled] = useState(false);
  const set = (k: string, v: unknown) => setF((x: any) => ({ ...x, [k]: v }));
  const payloads: Record<number, () => unknown> = {
    1: () => ({ name: f.name, dob: f.dob, gender: f.gender, college: f.college, languages: f.languages }),
    2: () => ({ kycConsent: f.kycConsent }),
    3: () => ({ collegeIdFront: f.front || undefined, collegeIdBack: f.back || undefined }),
    4: () => ({ selfie: f.selfie || undefined }),
    5: () => ({ categories: f.cats, voiceIntro: f.voiceIntro }),
    6: () => ({ grid: Object.fromEntries(DAYS.map((d) => [d, (f.grid[d] ?? []).flatMap((b: string) => BLOCKS[b])])), hoursPerWeek: f.hours, radiusM: f.radius }),
    7: () => ({ upi: f.upi, agreementAccepted: f.agree, safetyAccepted: f.safety }),
  };
  const next = async () => {
    setBusy(true); setErr("");
    const r = await fetch(`/api/helper/apply-${step}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payloads[step]()) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setErr(j.error?.message ?? "Kuch gadbad ho gayi"); return; }
    track("step_completed", { step });
    if (step === 7) { setDone(true); router.refresh(); } else setStep(step + 1);
  };
  if (done) {
    const stages = ["Submitted", "Documents under review", "Verification complete", "Training pending", "Shadow job pending", "Active"];
    const at = status === "active" ? 5 : status === "shadow" ? 4 : status === "training" ? 3 : status === "review" ? 1 : 0;
    return <div className="space-y-4"><h1 className="display text-3xl">Application status</h1><ol className="space-y-2">{stages.map((s, i) => <li key={s} className={`flex items-center gap-3 rounded-xl border-2 border-ink p-3 ${i <= at ? "bg-sage" : "bg-paper opacity-60"}`}><span className="mono">{i + 1}</span>{s}{i === at && <span className="stamp ml-auto">now</span>}</li>)}</ol><p className="text-sm">Documents ek insaan check karta hai. Kuch reject ho to wajah aur fix yahin dikhega.</p><a className="btn btn-forest" href="/earn/portal">Portal kholo</a></div>;
  }
  const L = (id: string, t: string) => <label htmlFor={id} className="mono mb-1 block text-xs uppercase">{t}</label>;
  return (
    <div className="space-y-4">
      <div className="flex gap-1" aria-label={`Step ${step} of 7`}>{STEPS.map((s, i) => <span key={s} className={`h-2 flex-1 rounded-full border-2 border-ink ${i < step ? "bg-forest" : "bg-paper"}`} />)}</div>
      <h1 className="display text-3xl">{step}. {STEPS[step - 1]}</h1>
      {step === 1 && <div className="space-y-3"><div>{L("n", "Naam")}<input id="n" className="field" value={f.name} onChange={(e) => set("name", e.target.value)} /></div><div>{L("d", "Date of birth (18+ only)")}<input id="d" type="date" className="field" value={f.dob} onChange={(e) => set("dob", e.target.value)} /></div><div className="flex gap-2">{["female", "male", "other"].map((g) => <button key={g} className="chip" aria-pressed={f.gender === g} onClick={() => set("gender", g)}>{g}</button>)}</div><p className="text-xs opacity-70">Gender sirf matching preferences ke liye.</p><div>{L("c", "College ya occupation")}<input id="c" className="field" value={f.college} onChange={(e) => set("college", e.target.value)} /></div><div className="flex flex-wrap gap-2">{["Hindi", "English", "Punjabi", "Bengali", "Tamil", "Telugu", "Malayalam"].map((l) => <button key={l} className="chip" aria-pressed={f.languages.includes(l)} onClick={() => set("languages", f.languages.includes(l) ? f.languages.filter((x: string) => x !== l) : [...f.languages, l])}>{l}</button>)}</div></div>}
      {step === 2 && <div className="space-y-3"><p>Aapki ID DigiLocker ya offline e-KYC se verify hogi. Shell kabhi poora Aadhaar number store nahi karta. Sirf ek reference aur verified flag.</p><label className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={f.kycConsent} onChange={(e) => set("kycConsent", e.target.checked)} /> Main KYC ke liye sahmat hoon (demo provider)</label></div>}
      {step === 3 && <div className="space-y-3"><p>College ID ki dono taraf ki photo.</p>{[["front", "Front"], ["back", "Back"]].map(([k, l]) => <label key={k} className="btn btn-cream cursor-pointer">{f[k] ? `${l} added` : `${l} photo`}<input type="file" accept="image/*" className="sr-only" onChange={async (e) => e.target.files?.[0] && set(k, await shrink(e.target.files[0]))} /></label>)}<p className="text-xs opacity-70">Freelancers: skip karo aur kaam ka proof step 5 mein do.</p></div>}
      {step === 4 && <div className="space-y-3"><p>Ek selfie. Provider ise ID ki photo se match karta hai.</p><label className="btn btn-cream cursor-pointer">{f.selfie ? "Selfie added" : "Selfie lo"}<input type="file" accept="image/*" capture="user" className="sr-only" onChange={async (e) => e.target.files?.[0] && set("selfie", await shrink(e.target.files[0]))} /></label></div>}
      {step === 5 && <div className="space-y-3"><div className="flex flex-wrap gap-2">{CATS.map(([s, l]) => { const on = f.cats.find((c: any) => c.slug === s); return <button key={s} className="chip" aria-pressed={!!on} onClick={() => set("cats", on ? f.cats.filter((c: any) => c.slug !== s) : [...f.cats, { slug: s, level: 3 }])}>{l}</button>; })}</div>{f.cats.map((c: any) => <div key={c.slug} className="flex items-center gap-3 text-sm"><span className="w-32">{CATS.find((x) => x[0] === c.slug)![1]}</span><input type="range" min={1} max={5} value={c.level} aria-label="Self rating" onChange={(e) => set("cats", f.cats.map((x: any) => (x.slug === c.slug ? { ...x, level: Number(e.target.value) } : x)))} /><span className="mono">{c.level}/5</span></div>)}<div>{L("v", "20-second intro (text for now)")}<textarea id="v" className="field" maxLength={300} value={f.voiceIntro} onChange={(e) => set("voiceIntro", e.target.value)} placeholder="Namaste, main ... hoon" /></div></div>}
      {step === 6 && <div className="space-y-3"><p className="text-sm">Apne class timetable ke hisaab se slots chuno.</p>{DAYS.map((d) => <div key={d} className="flex items-center gap-2"><span className="mono w-10 uppercase">{d}</span>{Object.keys(BLOCKS).map((b) => { const on = (f.grid[d] ?? []).includes(b); return <button key={b} className="chip !px-3" aria-pressed={on} onClick={() => set("grid", { ...f.grid, [d]: on ? f.grid[d].filter((x: string) => x !== b) : [...(f.grid[d] ?? []), b] })}>{b}</button>; })}</div>)}<label className="block text-sm font-bold">Hours per week: {f.hours}<input type="range" min={2} max={40} className="w-full" value={f.hours} onChange={(e) => set("hours", Number(e.target.value))} /></label><label className="block text-sm font-bold">Travel radius: {f.radius} m<input type="range" min={300} max={3000} step={100} className="w-full" value={f.radius} onChange={(e) => set("radius", Number(e.target.value))} /></label></div>}
      {step === 7 && <div className="space-y-3"><div>{L("u", "UPI ID (penny-drop verified)")}<input id="u" className="field" value={f.upi} onChange={(e) => set("upi", e.target.value)} placeholder="name@upi" /></div><div className="h-40 overflow-y-auto rounded-xl border-2 border-ink bg-paper p-3 text-sm" tabIndex={0} onScroll={(e) => { const t = e.currentTarget; if (t.scrollTop + t.clientHeight >= t.scrollHeight - 4) setScrolled(true); }}><b>Helper Agreement and Safety Policy (draft)</b><p className="mt-2">You are an independent provider. Never share personal numbers, never accept payment outside Shell, never enter a home without the door OTP, never perform closed categories, use SOS whenever you feel unsafe. Strikes are issued with reasons and evidence and you may appeal once. Payouts follow customer approval. Shell may suspend accounts for safety breaches.</p><p className="mt-2">Massage, makeup and personal care are not allowed. You will not do homework or assignments for anyone, only explain. You must be 18 or older.</p><p className="mt-2">Read more on the legal page. Scroll to the end to enable the checkboxes.</p><p className="mt-2">Thank you for being one of our first helpers.</p></div><label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" disabled={!scrolled} checked={f.agree} onChange={(e) => set("agree", e.target.checked)} /> Helper Agreement accept karta/karti hoon</label><label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" disabled={!scrolled} checked={f.safety} onChange={(e) => set("safety", e.target.checked)} /> Safety Policy accept karta/karti hoon</label></div>}
      {err && <p role="alert" className="rounded-xl bg-brick/10 p-3 font-semibold text-brick">{err}</p>}
      <div className="flex gap-2">{step > 1 && <button className="btn btn-cream" onClick={() => setStep(step - 1)}>Back</button>}<button className="btn btn-sun flex-1" disabled={busy} onClick={next}>{step === 7 ? "Application bhejo" : "Save aur aage"}</button></div>
    </div>
  );
}
