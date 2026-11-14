"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { send } from "@/lib/offline";
import { track } from "@/lib/analytics";

function useAct() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const run = async (url: string, body: unknown, method = "POST", ok = "Ho gaya") => { const r = await send(url, body, method); setMsg(r.ok ? (r.queued ? "Network nahi hai, save kar liya." : ok) : (r.error ?? "Error")); if (r.ok) router.refresh(); return r; };
  return { msg, run, router };
}
const Msg = ({ m }: { m: string }) => (m ? <p role="status" className="mt-2 text-sm font-semibold">{m}</p> : null);

export function CircleActions({ circleId, joined, link }: { circleId?: string; joined?: boolean; link?: string }) {
  const { msg, run } = useAct();
  if (circleId)
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {!joined && <button className="btn btn-sun btn-sm" onClick={async () => { const r = await run(`/api/circles/${circleId}/join`, {}); if (r.ok) track("circle_joined"); }}>Join karo</button>}
        <a className="btn btn-cream btn-sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent("Padosi, Shell Circle mein judo, price kam hota hai: " + (link ?? ""))}`} onClick={() => track("referral_shared")}>Padosi ko bulao</a>
        <Msg m={msg} />
      </div>
    );
  return null;
}

export function CircleCreate({ templates }: { templates: { slug: string; name: string }[] }) {
  const { msg, run } = useAct();
  const [t, setT] = useState(templates[0]?.slug ?? "");
  const [when, setWhen] = useState("");
  const [min, setMin] = useState(3);
  const [max, setMax] = useState(6);
  return (
    <div className="space-y-3 rounded-2xl border-2 border-ink bg-paper p-4"><h2 className="display text-xl">Make it a Circle</h2>
      <select className="field" aria-label="Task" value={t} onChange={(e) => setT(e.target.value)}>{templates.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}</select>
      <input className="field" type="datetime-local" aria-label="Start time" value={when} onChange={(e) => setWhen(e.target.value)} />
      <div className="grid grid-cols-2 gap-2"><label className="text-sm">Min flats<input className="field" type="number" min={2} max={10} value={min} onChange={(e) => setMin(Number(e.target.value))} /></label><label className="text-sm">Max flats<input className="field" type="number" min={2} max={12} value={max} onChange={(e) => setMax(Number(e.target.value))} /></label></div>
      <button className="btn btn-forest" disabled={!when} onClick={async () => { const r = await run("/api/circles", { templateSlug: t, windowStart: new Date(when).toISOString(), minFlats: min, maxFlats: Math.max(min, max) }, "POST", "Circle ban gaya"); if (r.ok) track("circle_created"); }}>Circle banao</button><Msg m={msg} />
    </div>
  );
}

export function SettingsForm({ name, language, quiet, consents, atlas }: { name: string; language: string; quiet: [number, number]; consents: { location: boolean; whatsapp: boolean }; atlas: { allergies?: string; keyHandling?: string; helperGender?: string; doNotTouch?: { text: string }[] } }) {
  const { msg, run } = useAct();
  const [n, setN] = useState(name);
  const [lang, setLang] = useState(language);
  const [q, setQ] = useState(quiet);
  const [al, setAl] = useState(atlas.allergies ?? "");
  const [dnt, setDnt] = useState((atlas.doNotTouch ?? []).map((d) => d.text).join("\n"));
  const [key, setKey] = useState(atlas.keyHandling ?? "guard");
  const [fem, setFem] = useState(atlas.helperGender === "female");
  const [tc, setTc] = useState({ name: "", phone: "" });
  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-2xl border-2 border-ink bg-paper p-4"><h2 className="display text-xl">Profile</h2><input className="field" aria-label="Name" value={n} onChange={(e) => setN(e.target.value)} /><div className="flex gap-2">{[["en", "English"], ["hi", "हिंदी"], ["hinglish", "Hinglish"]].map(([v, l]) => <button key={v} className="chip" aria-pressed={lang === v} onClick={() => setLang(v)}>{l}</button>)}</div><button className="btn btn-forest btn-sm" onClick={async () => { document.cookie = `shell_lang=${lang}; path=/; max-age=31536000`; await run("/api/me", { name: n, language: lang }, "PATCH"); }}>Save</button></div>
      <div className="space-y-2 rounded-2xl border-2 border-ink bg-paper p-4"><h2 className="display text-xl">Home Atlas</h2><label className="text-sm font-bold">Allergies<input className="field" value={al} onChange={(e) => setAl(e.target.value)} /></label><label className="text-sm font-bold">Do not touch (one per line)<textarea className="field" value={dnt} onChange={(e) => setDnt(e.target.value)} /></label><div className="flex flex-wrap gap-2">{[["home", "Main ghar par"], ["guard", "Guard ke paas"], ["lockbox", "Lockbox"]].map(([v, l]) => <button key={v} className="chip" aria-pressed={key === v} onClick={() => setKey(v)}>{l}</button>)}<button className="chip" aria-pressed={fem} onClick={() => setFem(!fem)}>Sirf female helper</button></div><button className="btn btn-forest btn-sm" onClick={() => run("/api/me", { atlas: { allergies: al, keyHandling: key, helperGender: fem ? "female" : "any", doNotTouch: dnt.split("\n").filter(Boolean).map((text) => ({ text })) } }, "PATCH")}>Save Atlas</button></div>
      <div className="space-y-2 rounded-2xl border-2 border-ink bg-paper p-4"><h2 className="display text-xl">Notifications and quiet hours</h2><div className="flex items-center gap-2 text-sm">Quiet from<input type="number" min={0} max={23} className="field !w-20" value={q[0]} onChange={(e) => setQ([Number(e.target.value), q[1]])} aria-label="Quiet start hour" />to<input type="number" min={0} max={23} className="field !w-20" value={q[1]} onChange={(e) => setQ([q[0], Number(e.target.value)])} aria-label="Quiet end hour" /></div><p className="text-xs opacity-70">Safety and arrival alerts always come through.</p><button className="btn btn-forest btn-sm" onClick={() => run("/api/me", { quietStart: q[0], quietEnd: q[1] }, "PATCH")}>Save</button></div>
      <div className="space-y-2 rounded-2xl border-2 border-ink bg-paper p-4"><h2 className="display text-xl">Privacy (DPDP)</h2><label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" defaultChecked={consents.location} onChange={(e) => run("/api/me", { consentLocation: e.target.checked }, "PATCH")} /> Location during active jobs</label><label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" defaultChecked={consents.whatsapp} onChange={(e) => run("/api/me", { consentWhatsapp: e.target.checked }, "PATCH")} /> WhatsApp updates</label><div className="flex flex-wrap gap-2"><a className="btn btn-cream btn-sm" href="/api/me/export">Download my data</a><button className="btn btn-ghost btn-sm" onClick={() => { if (confirm("Account delete karna hai? 7 din ka cooling period hoga.")) run("/api/me", {}, "DELETE", "Delete request mil gayi. 7 din mein account hat jayega."); }}>Delete my account</button></div></div>
      <div className="space-y-2 rounded-2xl border-2 border-ink bg-paper p-4"><h2 className="display text-xl">Trusted contact (SOS)</h2><input className="field" placeholder="Name" value={tc.name} onChange={(e) => setTc({ ...tc, name: e.target.value })} /><input className="field" placeholder="Phone" inputMode="tel" value={tc.phone} onChange={(e) => setTc({ ...tc, phone: e.target.value })} /><button className="btn btn-forest btn-sm" disabled={!tc.name || !tc.phone} onClick={() => run("/api/me", { trustedContact: tc }, "PATCH", "Contact add ho gaya")}>Add contact</button></div>
      <Msg m={msg} />
      <button className="btn btn-ghost w-full" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/app/login"; }}>Log out</button>
    </div>
  );
}

export function DisputeForm({ tasks, initial }: { tasks: { id: string; name: string }[]; initial?: string }) {
  const { msg, run } = useAct();
  const [t, setT] = useState(initial ?? tasks[0]?.id ?? "");
  const [reason, setReason] = useState("quality");
  const [d, setD] = useState("");
  return (
    <div className="space-y-3 rounded-2xl border-2 border-ink bg-paper p-4"><select className="field" aria-label="Task" value={t} onChange={(e) => setT(e.target.value)}>{tasks.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <div className="flex flex-wrap gap-2">{["quality", "no_show", "late", "damage", "overcharge", "safety", "other"].map((r) => <button key={r} className="chip" aria-pressed={reason === r} onClick={() => setReason(r)}>{r.replace("_", " ")}</button>)}</div>
      <textarea className="field" placeholder="Kya hua? Photos ya notes yahan." value={d} onChange={(e) => setD(e.target.value)} />
      <button className="btn btn-forest" disabled={!t} onClick={() => run("/api/me/disputes", { taskId: t, reason, description: d, evidence: d ? [{ kind: "text", text: d }] : [] }, "POST", "Dispute mil gaya. Hum 24 ghante mein reply denge.")}>Dispute raise karo</button><Msg m={msg} /></div>
  );
}

export function RoutineForm({ templates }: { templates: { slug: string; name: string }[] }) {
  const { msg, run } = useAct();
  const [t, setT] = useState(templates[0]?.slug ?? "");
  const [f, setF] = useState("weekly");
  const [w, setW] = useState("Sat 10am-12pm");
  return (
    <div className="space-y-3 rounded-2xl border-2 border-ink bg-paper p-4"><select className="field" aria-label="Task" value={t} onChange={(e) => setT(e.target.value)}>{templates.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}</select><div className="flex gap-2">{["weekly", "fortnightly", "monthly"].map((x) => <button key={x} className="chip" aria-pressed={f === x} onClick={() => setF(x)}>{x}</button>)}</div><input className="field" aria-label="Window" value={w} onChange={(e) => setW(e.target.value)} /><button className="btn btn-forest" onClick={async () => { const r = await run("/api/me/routines", { templateSlug: t, title: templates.find((x) => x.slug === t)?.name + ", " + f, frequency: f, windowText: w }); if (r.ok) track("routine_created"); }}>Routine banao</button><Msg m={msg} /></div>
  );
}

export function RoutineRow({ id, status }: { id: string; status: string }) {
  const { msg, run } = useAct();
  return <div className="mt-2 flex flex-wrap gap-2">{status === "paused" ? <button className="btn btn-cream btn-sm" onClick={() => run("/api/me/routines", { id, action: "resume" }, "PATCH")}>Resume</button> : <button className="btn btn-cream btn-sm" onClick={() => run("/api/me/routines", { id, action: "pause" }, "PATCH")}>Pause</button>}<button className="btn btn-cream btn-sm" onClick={() => run("/api/me/routines", { id, action: "skip" }, "PATCH")}>Skip next</button><button className="btn btn-ghost btn-sm" onClick={() => run("/api/me/routines", { id, action: "cancel" }, "PATCH")}>Cancel</button><Msg m={msg} /></div>;
}

export function CallbackButton() {
  const { msg, run } = useAct();
  return <div><button className="btn btn-cream btn-sm" onClick={() => run("/api/me/callback", {}, "POST", "Hum call karenge.")}>Call me back</button><Msg m={msg} /></div>;
}

export function MarkRead() {
  const { run } = useAct();
  return <button className="link-quiet text-sm font-bold" onClick={() => run("/api/me/read-notifications", {})}>Sab padh liye</button>;
}
