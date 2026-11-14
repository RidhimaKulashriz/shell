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
  const call = async (url: string, method: string, body: unknown) => { const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message ?? "Kuch gadbad ho gayi"); return j; };
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
      <div className="mb-6 flex gap-2" aria-label={`Step ${step + 1} of 4`}>{[0, 1, 2, 3].map((i) => <span key={i} className={`h-2 flex-1 rounded-full border-2 border-ink ${i <= step ? "bg-forest" : "bg-paper"}`} />)}</div>
      {step === 0 && (
        <div className="grid gap-4"><h1 className="display text-3xl">Aapki society kaun si hai?</h1>
          {societies.map((s) => <button key={s.id} className={`rounded-2xl border-2 border-ink p-4 text-left ${soc?.id === s.id ? "bg-forest text-cream" : "bg-paper"}`} onClick={() => setSoc(s)}><b>{s.name}</b><span className="mono block text-xs opacity-80">{s.status === "waitlist" ? `Not live yet. ${s.count} neighbours waiting.` : "Live pilot"}</span></button>)}
          {soc && !live && <div className="note"><p className="hand text-2xl">Not in your society yet</p><p className="text-sm">{soc.count} neighbours waiting, {Math.max(0, soc.target - soc.count)} more to unlock.</p><Link href={`/waitlist?society=${soc.name}`} className="btn btn-sun btn-sm mt-2">Waitlist join karo</Link></div>}
          <button className="btn btn-forest" disabled={!live} onClick={() => setStep(1)}>Aage</button>
        </div>
      )}
      {step === 1 && (
        <div className="grid gap-4"><h1 className="display text-3xl">Aapka ghar</h1>
          <div><label className="mono text-xs uppercase" htmlFor="nm">Aapka naam</label><input id="nm" className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><label className="mono text-xs uppercase" htmlFor="tw">Tower</label><select id="tw" className="field" value={f.towerId} onChange={(e) => setF({ ...f, towerId: e.target.value })}><option value="">Choose</option>{tw.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mono text-xs uppercase" htmlFor="fl">Floor</label><input id="fl" type="number" min={0} max={60} className="field" value={f.floor} onChange={(e) => setF({ ...f, floor: Number(e.target.value) })} /></div><div><label className="mono text-xs uppercase" htmlFor="fn">Flat</label><input id="fn" className="field" value={f.flat} onChange={(e) => setF({ ...f, flat: e.target.value })} placeholder="C-902" /></div></div>
          <div><label className="mono text-xs uppercase" htmlFor="lm">Landmark (Hindi ya English)</label><input id="lm" className="field" value={f.landmark} onChange={(e) => setF({ ...f, landmark: e.target.value })} placeholder="Lift lobby ke saamne" /></div>
          <div><label className="mono text-xs uppercase" htmlFor="en">Entry notes: guard, lift, parking</label><textarea id="en" className="field" value={f.entryNotes} onChange={(e) => setF({ ...f, entryNotes: e.target.value })} /></div>
          <p className="text-xs opacity-70">Hum aapki flat number se residency verify karenge. Tab tak aap sab dekh sakte ho.</p>
          <button className="btn btn-forest" disabled={!f.towerId || !f.flat} onClick={() => setStep(2)}>Aage</button>
        </div>
      )}
      {step === 2 && (
        <div className="grid gap-4"><h1 className="display text-3xl">Home Atlas <span className="hand text-xl">(skip kar sakte ho)</span></h1>
          <div className="flex items-center justify-between"><span className="font-bold">Ghar mein kitne log?</span><span className="flex items-center rounded-full border-2 border-ink"><button className="h-10 w-10" aria-label="Less" onClick={() => setAtlas({ ...atlas, household: Math.max(1, atlas.household - 1) })}>−</button><span className="mono w-6 text-center">{atlas.household}</span><button className="h-10 w-10" aria-label="More" onClick={() => setAtlas({ ...atlas, household: atlas.household + 1 })}>+</button></span></div>
          <label className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={atlas.kids} onChange={(e) => setAtlas({ ...atlas, kids: e.target.checked })} /> Ghar mein bachche hain</label>
          <div><label className="mono text-xs uppercase" htmlFor="pet">Pet (type)</label><input id="pet" className="field" value={atlas.pet} onChange={(e) => setAtlas({ ...atlas, pet: e.target.value })} placeholder="Dog, Labrador" /></div>
          <div><label className="mono text-xs uppercase" htmlFor="al">Cleaning product allergies</label><input id="al" className="field" value={atlas.allergies} onChange={(e) => setAtlas({ ...atlas, allergies: e.target.value })} /></div>
          <fieldset><legend className="mono mb-1 text-xs uppercase">Chaabi kaise?</legend><div className="flex flex-wrap gap-2">{([["home", "Main ghar par"], ["guard", "Guard ke paas"], ["lockbox", "Lockbox OTP"]] as const).map(([v, l]) => <button type="button" key={v} className="chip" aria-pressed={atlas.keyHandling === v} onClick={() => setAtlas({ ...atlas, keyHandling: v })}>{l}</button>)}</div></fieldset>
          <fieldset><legend className="mono mb-1 text-xs uppercase">Helper</legend><div className="flex gap-2">{([["any", "Koi bhi"], ["female", "Sirf female helper"]] as const).map(([v, l]) => <button type="button" key={v} className="chip" aria-pressed={atlas.helperGender === v} onClick={() => setAtlas({ ...atlas, helperGender: v })}>{l}</button>)}</div></fieldset>
          <fieldset><legend className="mono mb-1 text-xs uppercase">Rooms</legend><div className="flex flex-wrap gap-2">{roomsAll.map((r) => <button type="button" key={r} className="chip" aria-pressed={atlas.rooms.includes(r)} onClick={() => setAtlas({ ...atlas, rooms: atlas.rooms.includes(r) ? atlas.rooms.filter((x) => x !== r) : [...atlas.rooms, r] })}><Icon name={r === "Kitchen" ? "pan" : r === "Wardrobe" ? "hanger" : r === "Balcony" ? "plant" : r === "Study" ? "book" : "sofa"} size={20} tone="none" />{r}</button>)}</div></fieldset>
          <button className="btn btn-forest" onClick={() => setStep(3)}>Aage</button>
          <button className="link-quiet text-sm font-bold" onClick={() => setStep(3)}>Abhi skip</button>
        </div>
      )}
      {step === 3 && (
        <div className="grid gap-4"><h1 className="display text-3xl">Bas ek cheez</h1>
          <p>Location sirf active job ke dauraan share hoti hai, aur aap hamesha dekh sakte ho kab. WhatsApp par job updates aayenge. Aap ise Settings mein kabhi band kar sakte ho.</p>
          {err && <p role="alert" className="text-sm font-semibold text-brick">{err}</p>}
          <button className="btn btn-sun" disabled={busy} onClick={finish}>Main sahmat hoon, shuru karo</button>
        </div>
      )}
    </main>
  );
}
