"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { post, useToast, ActionButton } from "./client";
import { SocietyMap } from "./ui";
import { Icon } from "./icons";
import { lerp } from "@/lib/geo";
import { cn, fmtTime } from "@/lib/utils";

type Pt = { name: string; lat: number; lng: number };

export function LiveMap({ gates, towers, boundary, focusTower, status, enRouteAt, etaMin, helperName, floor }: { gates: Pt[]; towers: Pt[]; boundary: [number, number][]; focusTower: string; status: string; enRouteAt?: string | null; etaMin: number; helperName?: string; floor: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 2000); return () => clearInterval(i); }, []);
  const tower = towers.find((t) => t.name === focusTower) ?? towers[0];
  const gate = gates[1] ?? gates[0];
  const outside = { lat: gate.lat + 0.0012, lng: gate.lng + 0.0010 };
  let pos: { lat: number; lng: number } | null = null; let text = "Waiting for a helper to be assigned.";
  const who = helperName ?? "Your helper";
  if (["accepted", "offered", "planned"].includes(status)) { if (status === "accepted") text = `${who} is assigned and will set off soon.`; }
  if (status === "en_route") {
    const t = enRouteAt ? Math.min(1, (now - new Date(enRouteAt).getTime()) / (etaMin * 60000 * 0.5)) : 0.1;
    pos = t < 0.5 ? lerp(outside, gate, t * 2) : lerp(gate, tower, (t - 0.5) * 2);
    const left = Math.max(1, Math.ceil(etaMin * (1 - t)));
    text = t < 0.5 ? `${who} is on the way to the gate. About ${left} min to ${focusTower}, floor ${floor}.` : `${who} is inside the society. About ${left} min to ${focusTower}, floor ${floor}.`;
  }
  if (["arrived", "in_progress", "rework"].includes(status)) { pos = tower; text = `${who} is at ${focusTower}.`; }
  return (
    <div>
      <SocietyMap gates={gates} towers={towers} boundary={boundary} helper={pos} focusTower={focusTower} label="Live society map" />
      <p className="mt-2 text-sm font-medium" aria-live="polite">{text}</p>
      {pos && <p className="mt-1 flex items-center gap-1 text-xs text-ink/50"><Icon name="pin" size={14} />Location is shared only during this job.</p>}
    </div>
  );
}

const svg = (body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 260'>${body}</svg>`);
export const SAMPLE_BEFORE = svg(`<rect width='400' height='260' fill='#d9d1b8'/><rect y='170' width='400' height='90' fill='#c7bd9d'/><path d='M40 120c30-20 60 10 90-5s50 15 90 0M60 190c40 10 80-10 120 5s90-8 150 0' stroke='#a77f55' stroke-width='14' fill='none' stroke-linecap='round'/><circle cx='320' cy='80' r='26' fill='#b9a98a'/><text x='20' y='30' font-size='14' fill='#5a4d2e' font-family='sans-serif'>Sample: before</text>`);
export const SAMPLE_AFTER = svg(`<rect width='400' height='260' fill='#eef5ee'/><rect y='170' width='400' height='90' fill='#d8e8dc'/><rect x='60' y='90' width='120' height='70' rx='8' fill='#8eb69b'/><rect x='220' y='110' width='110' height='14' rx='3' fill='#e8c48a'/><circle cx='320' cy='70' r='22' fill='#daf1de' stroke='#235347' stroke-width='3'/><text x='20' y='30' font-size='14' fill='#235347' font-family='sans-serif'>Sample: after</text>`);

export function TimeMachine({ before, after }: { before?: string; after?: string }) {
  const [x, setX] = useState(50);
  const b = before || SAMPLE_BEFORE, a = after || SAMPLE_AFTER;
  return (
    <div>
      <div className="relative aspect-[400/260] w-full overflow-hidden rounded-2xl border border-line select-none">
        <img src={a} alt="After" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${x}%` }}><img src={b} alt="Before" className="h-full object-cover" style={{ width: `${10000 / Math.max(x, 1)}%`, maxWidth: "none" }} /></div>
        <div className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${x}%` }}><span className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs shadow">⇆</span></div>
        <span className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">Before</span><span className="absolute right-2 top-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">After</span>
      </div>
      <input type="range" min={0} max={100} value={x} onChange={(e) => setX(+e.target.value)} className="mt-2 w-full accent-[#235347]" aria-label="Compare before and after" />
      {(!before || !after) && <p className="text-xs text-ink/50">Sample images shown until your helper uploads photos.</p>}
    </div>
  );
}

export function SosButton({ taskId }: { taskId: string }) {
  const [p, setP] = useState(0); const [sent, setSent] = useState(false); const timer = useRef<ReturnType<typeof setInterval> | null>(null); const { show, node } = useToast();
  const fire = async (silent = false) => { try { navigator.vibrate?.([200, 100, 200]); await post(`/api/tasks/${taskId}/sos`, { silent }); setSent(true); } catch (e) { show((e as Error).message, "err"); } };
  const start = () => { let v = 0; timer.current = setInterval(() => { v += 5; setP(v); if (v >= 100) { clearInterval(timer.current!); fire(); } }, 100); };
  const stop = () => { if (timer.current) clearInterval(timer.current); setP(0); };
  useEffect(() => { let n = 0, last = 0; const h = (e: DeviceMotionEvent) => { const a = e.accelerationIncludingGravity; if (!a) return; const m = Math.abs((a.x ?? 0) + (a.y ?? 0) + (a.z ?? 0)); if (m > 28 && Date.now() - last > 250) { last = Date.now(); if (++n >= 3) { n = 0; fire(); } } }; window.addEventListener("devicemotion", h); return () => window.removeEventListener("devicemotion", h); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (sent) return <div role="status" className="rounded-2xl border-2 border-danger bg-[#f8dcd8] p-4 text-sm"><strong>SOS sent.</strong> Our team and the society guard have been alerted and your live location is being shared. Stay where you are if it&apos;s safe.</div>;
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-4">
        <button onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full bg-danger font-bold text-white" aria-label="Hold for 2 seconds to send SOS" style={{ background: `conic-gradient(#fff ${p * 3.6}deg, #b4372b 0)` }}><span className="grid h-14 w-14 place-items-center rounded-full bg-danger">SOS</span></button>
        <div className="text-sm"><strong>Safety</strong><p className="text-ink/60">Press and hold for 2 seconds, or shake your phone 3 times. We respond within 20 seconds.</p><button className="mt-1 text-xs underline" onClick={() => fire(true)}>Send a silent alert instead</button></div>
      </div>{node}
    </div>
  );
}

export function Chat({ threadKey, title = "Chat" }: { threadKey: string; title?: string }) {
  const [msgs, setMsgs] = useState<any[]>([]); const [text, setText] = useState(""); const [warn, setWarn] = useState(""); const end = useRef<HTMLDivElement>(null);
  const load = async () => { try { const d = await post<{ messages: any[] }>(`/api/threads/${encodeURIComponent(threadKey)}`, {}, "GET"); setMsgs(d.messages); } catch {} };
  useEffect(() => { load(); const i = setInterval(load, 4000); return () => clearInterval(i); }, [threadKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [msgs.length]);
  const send = async (e: React.FormEvent) => { e.preventDefault(); if (!text.trim()) return; const t = text; setText(""); try { const d = await post<{ message?: string }>(`/api/threads/${encodeURIComponent(threadKey)}`, { body: t }); setWarn(d.message ?? ""); load(); } catch (er) { setWarn((er as Error).message); } };
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line bg-bone px-4 py-2 text-sm font-semibold">{title}</div>
      <div className="h-64 space-y-2 overflow-y-auto p-3" aria-live="polite">
        {msgs.length === 0 && <p className="py-8 text-center text-sm text-ink/50">No messages yet. Say hello.</p>}
        {msgs.map((m) => <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.mine ? "ml-auto bg-tide text-cream" : "bg-cream")}><div className="text-[0.65rem] opacity-60">{m.who} · {fmtTime(m.at)}</div><span className={m.blurred ? "blur-[3px]" : ""}>{m.body}</span>{m.blurred && <div className="text-[0.65rem] text-danger">Contact details hidden</div>}</div>)}
        <div ref={end} />
      </div>
      {warn && <p role="alert" className="border-t border-line bg-[#fbefc9] px-3 py-2 text-xs">{warn}</p>}
      <form onSubmit={send} className="flex gap-2 border-t border-line p-2"><input className="input !min-h-[42px]" placeholder="Write a message" value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" /><button className="btn btn-primary btn-sm" aria-label="Send">Send</button></form>
      <p className="px-3 pb-2 text-[0.65rem] text-ink/50">Keep chat and payments inside Shell to stay covered by the Guarantee.</p>
    </div>
  );
}

export function ReviewForm({ taskId, helper }: { taskId: string; helper: string }) {
  const router = useRouter(); const { show, node } = useToast();
  const [rating, setRating] = useState(5); const [tags, setTags] = useState<string[]>([]); const [tip, setTip] = useState(0); const [note, setNote] = useState(""); const [thanks, setThanks] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <div className="card space-y-4 p-5">
      <h3 className="text-lg font-semibold">How was {helper}?</h3>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className={cn("text-3xl", n <= rating ? "text-sun" : "text-line")}>★</button>)}</div>
      <div className="flex flex-wrap gap-2">{["On time", "Polite", "Careful", "Thorough"].map((t) => <button key={t} className="chip" aria-pressed={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</button>)}</div>
      <div><div className="label">Add a tip (100% goes to {helper})</div><div className="flex flex-wrap gap-2">{[0, 20, 50, 100].map((v) => <button key={v} className="chip" aria-pressed={tip === v} onClick={() => setTip(v)}>{v ? `₹${v}` : "No tip"}</button>)}</div></div>
      <div><label className="label" htmlFor="rv-note">Private note to Shell (optional)</label><textarea id="rv-note" rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
      <div><label className="label" htmlFor="rv-thanks">Thank-you note for {helper} (optional)</label><textarea id="rv-thanks" rows={2} maxLength={160} className="note w-full !text-lg" value={thanks} onChange={(e) => setThanks(e.target.value)} placeholder="Thank you for…" /></div>
      <button className="btn btn-primary w-full" disabled={busy} onClick={async () => { setBusy(true); try { await post(`/api/tasks/${taskId}/review`, { rating, tags, tip, note, shellNote: thanks }); show("Thank you. Your review was sent."); router.refresh(); } catch (e) { show((e as Error).message, "err"); setBusy(false); } }}>Submit review</button>{node}
    </div>
  );
}

export function ReworkForm({ taskId, items }: { taskId: string; items: string[] }) {
  const router = useRouter(); const { show, node } = useToast(); const [open, setOpen] = useState(false); const [sel, setSel] = useState<number[]>([]); const [note, setNote] = useState("");
  if (!open) return <button className="btn btn-ghost" onClick={() => setOpen(true)}>Needs rework</button>;
  return (
    <div className="card w-full space-y-3 p-4">
      <h3 className="font-semibold">What needs fixing?</h3><p className="text-xs text-ink/60">We&apos;ll send the helper back within 24 hours, at no cost.</p>
      {items.map((it, i) => <label key={i} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={sel.includes(i)} onChange={() => setSel(sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i])} />{it}</label>)}
      <textarea className="input" rows={2} placeholder="Tell us what to fix" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Rework note" />
      <div className="flex gap-2"><button className="btn btn-primary btn-sm" onClick={async () => { try { await post(`/api/tasks/${taskId}/rework`, { items: sel, note }); show("Rework requested."); router.refresh(); } catch (e) { show((e as Error).message, "err"); } }}>Request rework</button><button className="btn btn-sm" onClick={() => setOpen(false)}>Cancel</button></div>{node}
    </div>
  );
}

export function ChangeRequests({ taskId, changes }: { taskId: string; changes: { id: string; minutes: number; delta: number; note: string; status: string }[] }) {
  const pending = changes.filter((c) => c.status === "pending");
  if (!pending.length) return null;
  return (
    <div className="space-y-3">{pending.map((c) => (
      <div key={c.id} className="rounded-2xl border-2 border-sun bg-[#fff8dc] p-4"><div className="font-semibold">Change request: {c.minutes} extra minutes</div><p className="text-sm text-ink/70">{c.note || "Your helper needs more time."} Price change: <strong>+₹{Math.round(c.delta / 100)}</strong></p>
        <div className="mt-3 flex gap-2"><ActionButton url={`/api/tasks/${taskId}/respond_change`} body={{ changeId: c.id, accept: true }} className="btn btn-primary btn-sm" success="Accepted">Accept</ActionButton><ActionButton url={`/api/tasks/${taskId}/respond_change`} body={{ changeId: c.id, accept: false }} className="btn btn-ghost btn-sm">Decline</ActionButton></div></div>))}</div>
  );
}

export function ExpensePanel({ taskId, cap, expense }: { taskId: string; cap: number; expense: { spent: number; items: { name: string; amount: number }[]; status: string; approved: number; refunded: number } | null }) {
  const [rej, setRej] = useState<number[]>([]);
  const inr = (p: number) => "₹" + Math.round(p / 100).toLocaleString("en-IN");
  return (
    <div className="card p-4"><h3 className="font-semibold">Expense wallet</h3>
      <p className="text-sm text-ink/70">Cap held: <strong>{inr(cap)}</strong>. Anything unspent is refunded to your Shell Wallet.</p>
      {!expense ? <p className="mt-2 text-sm text-ink/50">Waiting for your helper to upload the receipt.</p> : (
        <div className="mt-3">
          <ul className="space-y-1 text-sm" style={{ fontFamily: "var(--font-mono)" }}>{expense.items.map((it, i) => <li key={i} className="flex items-center gap-2">{expense.status === "pending_approval" && <input type="checkbox" aria-label={`Reject ${it.name}`} checked={rej.includes(i)} onChange={() => setRej(rej.includes(i) ? rej.filter((x) => x !== i) : [...rej, i])} />}<span className={cn("flex-1", rej.includes(i) && "line-through")}>{it.name}</span><span>{inr(it.amount)}</span></li>)}</ul>
          <div className="mt-2 flex justify-between border-t border-dashed border-ink/30 pt-2 text-sm"><span>Spent of cap</span><strong>{inr(expense.spent)} of {inr(cap)}</strong></div>
          {expense.status === "pending_approval" && <><p className="mt-1 text-xs text-ink/60">Tick any item you want to reject.</p><ActionButton url={`/api/tasks/${taskId}/expense_approve`} body={{ rejected: rej }} className="btn btn-primary btn-sm mt-3" success="Receipt approved">Approve receipt</ActionButton></>}
          {expense.status === "approved" && <span className="pill mt-2">Approved {inr(expense.approved)}</span>}
          {expense.status === "settled" && <span className="pill mt-2">Settled. {inr(expense.refunded)} refunded</span>}
        </div>)}
    </div>
  );
}

export function DisputeForm({ taskId }: { taskId: string }) {
  const { show, node } = useToast(); const [open, setOpen] = useState(false); const [reason, setReason] = useState("Quality"); const [d, setD] = useState("");
  if (!open) return <button className="text-sm underline" onClick={() => setOpen(true)}>Report a problem</button>;
  return (
    <div className="card space-y-3 p-4"><h3 className="font-semibold">Report a problem</h3>
      <div className="flex flex-wrap gap-2">{["Quality", "No show", "Late", "Damage", "Overcharge", "Safety", "Other"].map((r) => <button key={r} className="chip" aria-pressed={reason === r} onClick={() => setReason(r)}>{r}</button>)}</div>
      <textarea className="input" rows={3} placeholder="What happened?" value={d} onChange={(e) => setD(e.target.value)} aria-label="Describe the problem" />
      <p className="text-xs text-ink/60">A person on our team will reply within 24 hours.</p>
      <div className="flex gap-2"><button className="btn btn-primary btn-sm" onClick={async () => { try { await post("/api/disputes", { taskId, reason, description: d }); show("Sent. We'll reply within 24 hours."); setOpen(false); } catch (e) { show((e as Error).message, "err"); } }}>Send</button><button className="btn btn-sm" onClick={() => setOpen(false)}>Cancel</button></div>{node}</div>
  );
}

export function DemoStep({ taskId, label = "Simulate the next helper step" }: { taskId: string; label?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-euca/50 bg-cream/60 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-euca">Demo controls</p><p className="mb-2 text-sm text-ink/70">Try the whole flow on your own. This acts as the helper would.</p>
      <ActionButton url={`/api/tasks/${taskId}/demo`} className="btn btn-ghost btn-sm">{label}</ActionButton></div>
  );
}

export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return <button className="btn btn-ghost btn-sm" onClick={async () => { await navigator.clipboard?.writeText(text.startsWith("/") ? location.origin + text : text); setOk(true); setTimeout(() => setOk(false), 2000); }}>{ok ? "Copied" : label}</button>;
}
