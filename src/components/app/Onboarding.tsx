"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { track } from "@/lib/analytics";

type Soc = { id: string; name: string; status: string; count: number; target: number };
type Tw = { id: string; societyId: string; name: string; floors: number };

export function Onboarding({ societies, towers }: { societies: Soc[]; towers: Tw[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [soc, setSoc] = useState<Soc | null>(null);
  const [f, setF] = useState({ towerId: "", floor: 1, flat: "", landmark: "", entryNotes: "", name: "" });
  const [atlas, setAtlas] = useState<{ household: number; kids: boolean; pet: string; allergies: string; keyHandling: "home" | "guard" | "lockbox"; helperGender: "any" | "female"; rooms: string[] }>({ household: 2, kids: false, pet: "", allergies: "", keyHandling: "guard", helperGender: "any", rooms: ["Living room", "Kitchen", "Bedroom"] });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const live = soc && soc.status !== "waitlist";
  const call = async (url: string, method: string, body: unknown) => { const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message ?? "Something went wrong. Please try again."); return j; };
  const finish = async () => {
    setBusy(true); setErr("");
    try {
      if (f.name) await call("/api/me", "PATCH", { name: f.name });
      await call("/api/onboarding", "POST", { societyId: soc!.id, towerId: f.towerId, floor: f.floor, flat: f.flat, landmark: f.landmark, entryNotes: f.entryNotes });
      await call("/api/me", "PATCH", { consentLocation: true, consentWhatsapp: true, atlas: { household: atlas.household, kids: atlas.kids, pets: atlas.pet ? [{ type: atlas.pet, temperament: "ask owner" }] : [], allergies: atlas.allergies, keyHandling: atlas.keyHandling, helperGender: atlas.helperGender, rooms: atlas.rooms } });
      track("society_selected"); track("atlas_completed");
      router.push("/app"); router.refresh();
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  const tw = towers.filter((t) => t.societyId === soc?.id);
  const roomsAll = ["Living room", "Kitchen", "Bedroom", "Balcony", "Wardrobe", "Study"];
  return (
    <main id="main" className="mx-auto max-w-md px-5 py-8">
      <div className="mb-6 flex gap-2" aria-label={`Step ${step + 1} of 4`}>{[0, 1, 2, 3].map((i) => <span key={i} className={`h-2 flex-1 rounded-full border border-ink/20 ${i <= step ? "bg-forest" : "bg-paper"}`} />)}</div>
      {step === 0 && (
        <div className="grid gap-4"><h1 className="display text-3xl">Which society do you live in?</h1>
          {societies.map((s) => <button key={s.id} className={`rounded-2xl border border-ink/20 p-4 text-left ${soc?.id === s.id ? "bg-forest text-cream" : "bg-paper"}`} onClick={() => setSoc(s)}><b>{s.name}</b><span className="mono block text-xs opacity-80">{s.status === "waitlist" ? `Not live yet. ${s.count} neighbours waiting.` : "Live pilot"}</span></button>)}
          {soc && !live && <div className="note"><p className="hand text-2xl">Not in your society yet</p><p className="text-sm">{soc.count} neighbours waiting, {Math.max(0, soc.target - soc.count)} more to unlock.</p><Link href={`/waitlist?society=${soc.name}`} className="btn btn-sun btn-sm mt-2">Join the waitlist</Link></div>}
          <button className="btn btn-forest" disabled={!live} onClick={() => setStep(1)}>Aage</button>
        </div>
      )}
      {step === 1 && (
        <div className="grid gap-4"><h1 className="display text-3xl">Your home</h1>
          <div><label className="mono text-xs uppercase" htmlFor="nm">Your name</label><input id="nm" className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label className="mono text-xs uppercase" htmlFor="tw">Tower</label><select id="tw" className="field" value={f.towerId} onChange={(e) => setF({ ...f, towerId: e.target.value })}><option value="">Choose</option>{tw.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mono text-xs uppercase" htmlFor="fl">Floor</label><input id="fl" type="number" min={0} max={60} className="field" value={f.floor} onChange={(e) => setF({ ...f, floor: Number(e.target.value) })} /></div><div><label className="mono text-xs uppercase" htmlFor="fn">Flat</label><input id="fn" className="field" value={f.flat} onChange={(e) => setF({ ...f, flat: e.target.value })} placeholder="C-902" /></div></div>
          <div><label className="mono text-xs uppercase" htmlFor="lm">Landmark (Hindi ya English)</label><input id="lm" className="field" value={f.landmark} onChange={(e) => setF({ ...f, landmark: e.target.value })} placeholder="Lift lobby ke saamne" /></div>
          <div><label className="mono text-xs uppercase" htmlFor="en">Entry notes: guard, lift, parking</label><textarea id="en" className="field" value={f.entryNotes} onChange={(e) => setF({ ...f, entryNotes: e.target.value })} /></div>
          <p className="text-xs opacity-70">We will verify your residency using your flat number. Until then you can browse everything.</p>
          <button className="btn btn-forest" disabled={!f.towerId || !f.flat} onClick={() => setStep(2)}>Aage</button>
        </div>
      )}
      {step === 2 && (
        <div className="grid gap-4"><h1 className="display text-3xl">Home Atlas <span className="hand text-xl">(skip kar sakte ho)</span></h1>
          <div className="flex items-center justify-between"><span className="font-bold">How many people live in the home?</span><span className="flex items-center rounded-full border border-ink/20"><button className="h-10 w-10" aria-label="Less" onClick={() => setAtlas({ ...atlas, household: Math.max(1, atlas.household - 1) })}>−</button><span className="mono w-6 text-center">{atlas.household}</span><button className="h-10 w-10" aria-label="More" onClick={() => setAtlas({ ...atlas, household: atlas.household + 1 })}>+</button></span></div>
          <label className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={atlas.kids} onChange={(e) => setAtlas({ ...atlas, kids: e.target.checked })} /> There are children at home</label>
          <div><label className="mono text-xs uppercase" htmlFor="pet">Pet (type)</label><input id="pet" className="field" value={atlas.pet} onChange={(e) => setAtlas({ ...atlas, pet: e.target.value })} placeholder="Dog, Labrador" /></div>
          <div><label className="mono text-xs uppercase" htmlFor="al">Cleaning product allergies</label><input id="al" className="field" value={atlas.allergies} onChange={(e) => setAtlas({ ...atlas, allergies: e.target.value })} /></div>
          <fieldset><legend className="mono mb-1 text-xs uppercase">How will the helper get in?</legend><div className="flex flex-wrap gap-2">{([["home", "I will be home"], ["guard", "Key with the guard"], ["lockbox", "Lockbox OTP"]] as const).map(([v, l]) => <button type="button" key={v} className="chip" aria-pressed={atlas.keyHandling === v} onClick={() => setAtlas({ ...atlas, keyHandling: v })}>{l}</button>)}</div></fieldset>
          <fieldset><legend className="mono mb-1 text-xs uppercase">Helper</legend><div className="flex gap-2">{([["any", "Any"], ["female", "Female helper only"]] as const).map(([v, l]) => <button type="button" key={v} className="chip" aria-pressed={atlas.helperGender === v} onClick={() => setAtlas({ ...atlas, helperGender: v })}>{l}</button>)}</div></fieldset>
          <fieldset><legend className="mono mb-1 text-xs uppercase">Rooms</legend><div className="flex flex-wrap gap-2">{roomsAll.map((r) => <button type="button" key={r} className="chip" aria-pressed={atlas.rooms.includes(r)} onClick={() => setAtlas({ ...atlas, rooms: atlas.rooms.includes(r) ? atlas.rooms.filter((x) => x !== r) : [...atlas.rooms, r] })}><Icon name={r === "Kitchen" ? "pan" : r === "Wardrobe" ? "hanger" : r === "Balcony" ? "plant" : r === "Study" ? "book" : "sofa"} size={20} tone="none" />{r}</button>)}</div></fieldset>
          <button className="btn btn-forest" onClick={() => setStep(3)}>Aage</button>
          <button className="link-quiet text-sm font-bold" onClick={() => setStep(3)}>Skip for now</button>
        </div>
      )}
      {step === 3 && (
        <div className="grid gap-4"><h1 className="display text-3xl">One last thing</h1>
          <p>Your location is shared only during an active job, and you can always see when. Job updates arrive on WhatsApp. You can turn this off in Settings at any time.</p>
          {err && <p role="alert" className="text-sm font-semibold text-brick">{err}</p>}
          <button className="btn btn-sun" disabled={busy} onClick={finish}>I agree. Continue</button>
        </div>
      )}
    </main>
  );
}
