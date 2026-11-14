"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Chat } from "@/components/app/Chat";
import { Countdown } from "@/components/ui";
import { inr } from "@/lib/format";
import { send } from "@/lib/offline";
import { track } from "@/lib/analytics";

export function OnlineToggle({ online, rush, circle, active }: { online: boolean; rush: boolean; circle: boolean; active: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(online);
  const [err, setErr] = useState("");
  const set = async (b: Record<string, boolean>) => { const r = await send("/api/helper/online", { online: on, ...b }); if (!r.ok) setErr(r.error ?? "Error"); else router.refresh(); return r; };
  return (
    <div className="rounded-2xl border border-ink/20 bg-paper p-4">
      <button role="switch" aria-checked={on} aria-label="Go online" onClick={async () => { const r = await send("/api/helper/online", { online: !on }); if (r.ok) { setOn(!on); track("went_online"); router.refresh(); } else setErr(r.error ?? "Error"); }} className={`relative h-14 w-full rounded-full border border-ink/20 transition-colors ${on ? "bg-sage" : "bg-cream"}`}>
        <span className={`absolute top-1 h-10 w-24 rounded-full border border-ink/20 bg-sun font-bold leading-9 transition-all ${on ? "left-[calc(100%-6.25rem)]" : "left-1"}`}>{on ? "ONLINE" : "OFFLINE"}</span>
        <span className="sr-only">{on ? "You are online" : "You are offline"}</span>
      </button>
      <div className="mt-3 flex flex-wrap gap-2"><button className="chip" aria-pressed={rush} onClick={() => set({ rush: !rush })}>Shell Rush (90 min)</button><button className="chip" aria-pressed={circle} onClick={() => set({ circle: !circle })}>Circle batches</button></div>
      {!active && <p className="mt-2 text-xs">You can go online only after your application is approved and training is complete.</p>}
      {err && <p role="alert" className="mt-2 text-sm font-semibold text-brick">{err}</p>}
    </div>
  );
}

export type OfferV = { id: string; task: string; payout: number; minutes: number; tower: string; distanceM: number; start: string | null; expiresAt: string | null; rush: boolean; notes: string; breakdown: Record<string, number> };

export function OfferCard({ o }: { o: OfferV }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [help, setHelp] = useState(false);
  track("offer_viewed");
  const act = async (a: "accept" | "decline", reason?: string) => { const r = await send(`/api/offers/${o.id}/${a}`, { reason }); if (!r.ok) setMsg(r.error ?? "Error"); else { track(a === "accept" ? "offer_accepted" : "offer_declined", { reason }); router.refresh(); } };
  return (
    <div className="rounded-2xl border border-ink/20 bg-sun/40 p-4">
      <div className="flex items-start justify-between"><b className="display text-xl">{o.task}</b><span className="mono text-xl">{inr(o.payout)}</span></div>
      <p className="mono text-xs">{o.tower} · {o.distanceM} m · {o.minutes} min {o.rush && <span className="stamp stamp-brick ml-1">RUSH</span>}</p>
      {o.notes && <p className="mt-1 text-sm">{o.notes}</p>}
      {o.expiresAt && <p className="mt-1 text-sm font-bold">Reply in <Countdown to={o.expiresAt} /></p>}
      <div className="mt-3 flex flex-wrap gap-2"><button className="btn btn-forest flex-1" onClick={() => act("accept")}>Accept</button>{["Busy", "Too far", "Class"].map((r) => <button key={r} className="btn btn-ghost btn-sm" onClick={() => act("decline", r)}>{r}</button>)}<button className="link-quiet text-xs font-bold" onClick={() => setHelp(!help)}>Dispatch rules</button></div>
      {help && <p className="mt-2 rounded-xl bg-paper p-2 text-xs">Offers go to the best-scored eligible helpers: distance {o.breakdown.distance ?? 0}, skill {o.breakdown.skill ?? 0}, rating {o.breakdown.rating ?? 0}, on-time {o.breakdown.onTime ?? 0}, repeat {o.breakdown.repeat ?? 0}. First to accept gets the job.</p>}
      {msg && <p role="alert" className="mt-2 text-sm font-semibold text-brick">{msg}</p>}
    </div>
  );
}

type Job = { id: string; name: string; status: string; checklist: { label: string; done: boolean }[]; lat: number; lng: number; photos: { kind: string }[]; expensesCap: number; extra: string[] };

/** Job flow: en route, geofenced check-in with door OTP and selfie, adaptive location pings (only while active), checklist, photos, extra time, receipt, checkout. */
export function JobFlow({ job }: { job: Job }) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [selfie, setSelfie] = useState("");
  const tracking = ["en_route", "arrived", "in_progress"].includes(job.status);
  const buffer = useRef<any[]>([]);
  const lastSent = useRef(0);
  useEffect(() => {
    if (!tracking || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition((p) => {
      buffer.current.push({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, speed: p.coords.speed ?? undefined, heading: p.coords.heading ?? undefined, ts: p.timestamp });
      const interval = (p.coords.speed ?? 0) > 1 ? 10000 : 30000; // adaptive: faster when moving, slow when idle
      if (Date.now() - lastSent.current > interval) { lastSent.current = Date.now(); const pings = buffer.current.splice(0); send("/api/helper/location", { taskId: job.id, pings }); }
    }, () => {}, { enableHighAccuracy: true, maximumAge: 5000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [tracking, job.id]);
  const act = async (a: string, body: unknown = {}) => { setBusy(true); setMsg(""); const r = await send(`/api/tasks/${job.id}/${a}`, body); setBusy(false); if (!r.ok) setMsg(r.error ?? "Error"); else router.refresh(); return r; };
  const position = (demo: boolean) => new Promise<{ lat: number; lng: number; accuracy?: number }>((res) => { if (demo || !navigator.geolocation) return res({ lat: job.lat, lng: job.lng }); navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }), () => res({ lat: job.lat, lng: job.lng }), { timeout: 4000 }); });
  const photo = async (kind: string, f?: File) => { if (!f) return; const img = await createImageBitmap(f); const s = Math.min(1, 900 / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = img.width * s; c.height = img.height * s; c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); await act("photo", { kind, url: c.toDataURL("image/jpeg", 0.65) }); };
  const [items, setItems] = useState([{ name: "", amount: "" }]);
  return (
    <div className="space-y-4">
      {tracking && <p className="flex items-center gap-2 rounded-full bg-sage px-3 py-1 text-xs font-bold"><span className="pulse-dot h-2.5 w-2.5 rounded-full bg-forest" />Tracking is on. Your location is shared only for this job and stops at check-out.</p>}
      {job.status === "accepted" && <button className="btn btn-forest w-full" disabled={busy} onClick={() => act("enroute")}>I am on my way</button>}
      {["accepted", "en_route", "arrived"].includes(job.status) && (
        <div className="space-y-2 rounded-2xl border border-ink/20 bg-paper p-4"><h2 className="display text-xl">Check-in</h2><p className="text-xs">Available within 150 m of the address, with the door OTP. Three wrong OTPs alert ops.</p>
          <input className="field mono text-2xl tracking-[0.5em]" inputMode="numeric" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} aria-label="Door OTP" placeholder="----" />
          <label className="btn btn-cream btn-sm cursor-pointer">{selfie ? "Selfie added" : "Selfie lo"}<input type="file" accept="image/*" capture="user" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const img = await createImageBitmap(f); const c = document.createElement("canvas"); c.width = 320; c.height = 320 * img.height / img.width; c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); setSelfie(c.toDataURL("image/jpeg", 0.5)); }} /></label>
          <div className="flex gap-2"><button className="btn btn-sun flex-1" disabled={otp.length !== 4 || busy} onClick={async () => { const p = await position(false); const r = await act("checkin", { ...p, otp, selfie: selfie || undefined }); if (r.ok) track("checkin_success"); }}>Check in</button><button className="btn btn-ghost btn-sm" disabled={otp.length !== 4 || busy} onClick={async () => act("checkin", { ...(await position(true)), otp })}>Demo: address location</button></div></div>
      )}
      {job.status === "in_progress" && (<>
        <div className="space-y-2 rounded-2xl border border-ink/20 bg-paper p-4"><h2 className="display text-xl">Checklist</h2>{job.checklist.map((c, i) => <button key={i} role="checkbox" aria-checked={c.done} className="flex w-full items-center gap-3 rounded-xl bg-cream p-3 text-left" onClick={() => act("checklist", { index: i, done: !c.done })}><span className={`grid h-6 w-6 place-items-center rounded border border-ink/20 ${c.done ? "bg-sage" : ""}`}>{c.done && <svg viewBox="0 0 24 24" width="16" height="16"><path className="draw on" pathLength={1} d="M3 13 L9.5 19.5 L21 5" fill="none" stroke="#0e1a17" strokeWidth="3" strokeLinecap="round" /></svg>}</span>{c.label}</button>)}</div>
        <div className="flex flex-wrap gap-2">{["before", "after"].map((k) => <label key={k} className="btn btn-cream btn-sm cursor-pointer">Photo: {k} ({job.photos.filter((p) => p.kind === k).length})<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => photo(k, e.target.files?.[0])} /></label>)}</div>
        <p className="text-xs opacity-70">Tip: shoot straight on from the doorway, in good light.</p>
        <div className="flex flex-wrap gap-2"><button className="btn btn-cream btn-sm" onClick={() => act("change", { kind: "extra_time", minutes: 30 })}>+30 min maango</button><button className="btn btn-cream btn-sm" onClick={() => act("change", { kind: "extra_task" })}>Extra task maango</button></div>
        {job.expensesCap > 0 && <div className="space-y-2 rounded-2xl border border-ink/20 bg-paper p-4"><h2 className="display text-xl">Receipt (cap {inr(job.expensesCap)})</h2>{items.map((it, i) => <div key={i} className="flex gap-2"><input className="field" placeholder="Item" value={it.name} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /><input className="field !w-28" inputMode="numeric" placeholder="₹" value={it.amount} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} /></div>)}<div className="flex gap-2"><button className="btn btn-ghost btn-sm" onClick={() => setItems([...items, { name: "", amount: "" }])}>+ line</button><button className="btn btn-forest btn-sm" onClick={() => act("expense", { receiptUrl: "data:,receipt", items: items.filter((i) => i.name && i.amount).map((i) => ({ name: i.name, amount: Math.round(Number(i.amount) * 100) })) })}>Submit receipt</button></div></div>}
        <button className="btn btn-sun w-full" disabled={busy} onClick={() => act("checkout", { partial: job.checklist.some((c) => !c.done) })}>Check-out</button>
      </>)}
      {job.status === "awaiting_approval" && <p className="rounded-xl bg-sage p-3 font-semibold">Waiting for customer approval. Your estimated payout is ready.</p>}
      {job.status === "approved" && <p className="hand text-2xl">Done. Payout scheduled.</p>}
      {["accepted", "en_route", "arrived", "in_progress"].includes(job.status) && <Chat threadKey={`task:${job.id}`} me="HELPER" title="Customer chat" />}
      {["en_route", "arrived", "in_progress"].includes(job.status) && <button className="btn w-full bg-brick text-cream" onClick={() => act("sos", { kind: "silent" })}>SOS (silent)</button>}
      {msg && <p role="alert" className="rounded-xl bg-brick/10 p-3 font-semibold text-brick">{msg}</p>}
    </div>
  );
}

export function PayoutButton({ pending }: { pending: number }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  return <div><button className="btn btn-sun" disabled={pending <= 0} onClick={async () => { const r = await send("/api/helper/payout", {}); setMsg(r.ok ? `Sent ${inr(r.data?.amount ?? 0)} (fee ${inr(r.data?.fee ?? 0)})` : (r.error ?? "")); track("payout_requested"); router.refresh(); }}>Instant payout (1% fee)</button><p className="mt-1 text-xs">Ya free weekly payout Friday ko.</p>{msg && <p role="status" className="text-sm font-semibold">{msg}</p>}</div>;
}

export function QuizModule({ m }: { m: { slug: string; title: string; mandatory: boolean; cards: { title: string; body: string }[]; quiz: { q: string; options: string[] }[]; passed: boolean } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<number[]>([]);
  const [res, setRes] = useState<{ score: number; passed: boolean } | null>(null);
  const finish = async () => { const r = await send("/api/helper/training", { module: m.slug, answers: ans }); if (r.data) { setRes(r.data); track("training_module_done"); router.refresh(); } };
  return (
    <div className="rounded-2xl border border-ink/20 bg-paper p-4"><div className="flex items-center justify-between"><b className="display text-xl">{m.title}</b>{m.passed ? <span className="stamp">passed</span> : m.mandatory ? <span className="stamp stamp-brick">mandatory</span> : null}</div>
      {!open ? <button className="btn btn-forest btn-sm mt-2" onClick={() => setOpen(true)}>{m.passed ? "Review again" : "Start"}</button> : res ? <p className="mt-2 font-bold">{res.passed ? `Passed with ${res.score}%` : `${res.score}%. The pass mark is 80%. Please try again.`}</p> : (
        <div className="mt-3 space-y-3">{i < m.cards.length ? <div className="rounded-xl bg-cream p-3"><b>{m.cards[i].title}</b><p className="text-sm">{m.cards[i].body}</p><button className="btn btn-forest btn-sm mt-2" onClick={() => setI(i + 1)}>Next</button></div> : <>
          {m.quiz.map((q, qi) => <fieldset key={qi}><legend className="font-bold">{qi + 1}. {q.q}</legend>{q.options.map((o, oi) => <label key={oi} className="mt-1 flex items-center gap-2"><input type="radio" name={`${m.slug}${qi}`} checked={ans[qi] === oi} onChange={() => { const n = [...ans]; n[qi] = oi; setAns(n); }} />{o}</label>)}</fieldset>)}
          <button className="btn btn-sun btn-sm" disabled={ans.filter((x) => x !== undefined).length < m.quiz.length} onClick={finish}>Submit quiz</button></>}</div>)}
    </div>
  );
}

export function PassportControls({ vis, slug }: { vis: { rating: boolean; jobs: boolean; college: boolean; languages: boolean }; slug: string }) {
  const [v, setV] = useState(vis);
  const [msg, setMsg] = useState("");
  const upd = async (k: keyof typeof v) => { const n = { ...v, [k]: !v[k] }; setV(n); const r = await send("/api/helper/passport", n); setMsg(r.ok ? "Saved" : ""); };
  return <div className="rounded-2xl border border-ink/20 bg-paper p-4"><h2 className="display text-xl">Public link: choose what is visible</h2><div className="mt-2 flex flex-wrap gap-2">{(Object.keys(v) as (keyof typeof v)[]).map((k) => <button key={k} className="chip" aria-pressed={v[k]} onClick={() => upd(k)}>{k}</button>)}</div><div className="mt-3 flex flex-wrap gap-2"><a className="btn btn-forest btn-sm" href={`/p/${slug}`} target="_blank">Public link</a><a className="btn btn-cream btn-sm" href={`/p/${slug}/resume`} target="_blank">PDF resume</a></div>{msg && <p className="text-xs">{msg}</p>}</div>;
}

export function AppealButton({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  return <div className="mt-2 flex gap-2"><input className="field" placeholder="Write your intro" value={note} onChange={(e) => setNote(e.target.value)} /><button className="btn btn-forest btn-sm" disabled={note.length < 5} onClick={async () => { await send("/api/helper/appeal", { strikeId: id, note }); router.refresh(); }}>Appeal</button></div>;
}
