"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chat } from "@/components/app/Chat";
import { HelperCard, type HelperCardData } from "@/components/app/HelperCard";
import { PulseMap, type MapTower } from "@/components/maps";
import { TimeMachine } from "@/components/TimeMachine";
import { Countdown, Ring, Stamp, Tick } from "@/components/ui";
import { inr, fmtDateTime } from "@/lib/format";
import { readinessPct } from "@/lib/statemachine";
import { send } from "@/lib/offline";
import { track } from "@/lib/analytics";

export type TTask = { id: string; name: string; status: string; price: number; helper: HelperCardData | null; checklist: { label: string; done: boolean }[]; otp: string | null; before: string | null; after: string | null; expense: { cap: number; spent: number; status: string; items: { name: string; amount: number }[] } | null; changes: { id: string; kind: string; minutes: number; delta: number }[]; reviewed: boolean; canRework: boolean; start: string | null };
type Live = { line: string; helper: { name: string; lat: number; lng: number } | null; sharing: boolean; readiness: number };

const LABEL: Record<string, string> = { planned: "Waiting", offered: "Finding helper", accepted: "Helper assigned", en_route: "On the way", arrived: "Arrived", in_progress: "In progress", awaiting_approval: "Needs your input", approved: "Approved", rework: "Rework", cancelled: "Cancelled", failed: "Failed" };

export function Tracker({ plan, tasks, map, shareToken }: { plan: { id: string; title: string; deadlineAt: string | null }; tasks: TTask[]; map: { boundary: [number, number][]; gates: { name: string; lat: number; lng: number }[]; towers: MapTower[]; me: { lat: number; lng: number; tower: string } | null }; shareToken: string | null }) {
  const router = useRouter();
  const [tab, setTab] = useState<"timeline" | "map" | "chat">("timeline");
  const activeTask = tasks.find((t) => ["en_route", "arrived", "in_progress", "accepted"].includes(t.status));
  const [live, setLive] = useState<Live | null>(null);
  const [sos, setSos] = useState<"idle" | "countdown" | "sent">("idle");
  const [cd, setCd] = useState(5);
  const [copied, setCopied] = useState(false);
  const readiness = live?.readiness ?? readinessPct(tasks.map((t) => t.status));
  track("tracker_viewed");

  useEffect(() => {
    if (!activeTask) return;
    const es = new EventSource(`/api/tasks/${activeTask.id}/track`);
    es.onmessage = (e) => setLive(JSON.parse(e.data));
    return () => es.close();
  }, [activeTask?.id]);
  useEffect(() => { if (sos !== "countdown") return; if (cd <= 0) { trigger(); return; } const t = setTimeout(() => setCd(cd - 1), 1000); return () => clearTimeout(t); }, [sos, cd]);
  async function trigger() {
    setSos("sent");
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    const pos = await new Promise<GeolocationPosition | null>((res) => (navigator.geolocation ? navigator.geolocation.getCurrentPosition(res, () => res(null), { timeout: 3000 }) : res(null)));
    await send(`/api/tasks/${(activeTask ?? tasks[0]).id}/sos`, { kind: "loud", lat: pos?.coords.latitude, lng: pos?.coords.longitude });
  }
  // shake 3 times to SOS
  const shakes = useRef<number[]>([]);
  useEffect(() => {
    const on = (e: DeviceMotionEvent) => { const a = e.accelerationIncludingGravity; if (!a) return; if (Math.abs(a.x ?? 0) + Math.abs(a.y ?? 0) + Math.abs(a.z ?? 0) > 38) { const n = Date.now(); shakes.current = [...shakes.current.filter((x) => n - x < 1500), n]; if (shakes.current.length >= 3) { shakes.current = []; setSos("countdown"); setCd(5); } } };
    window.addEventListener("devicemotion", on);
    return () => window.removeEventListener("devicemotion", on);
  }, []);
  const holdRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-[26px] border-2 border-ink bg-forest p-4 text-cream">
        <Ring pct={readiness} size={116} tone="cream" />
        <div className="min-w-0 flex-1"><h1 className="display text-2xl leading-tight">{plan.title}</h1>{plan.deadlineAt && <p className="mono text-sm text-sage">Deadline <Countdown to={plan.deadlineAt} prefix="in " /></p>}<button className="btn btn-cream btn-sm mt-2" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/s/${shareToken}`); setCopied(true); }}>{copied ? "Link copied" : "Family ke saath share karo"}</button></div>
      </div>
      {live?.sharing && <p className="flex items-center gap-2 rounded-full bg-sage px-3 py-1 text-xs font-bold"><span className="pulse-dot h-2.5 w-2.5 rounded-full bg-forest" />Helper ki location abhi share ho rahi hai (sirf is job ke liye)</p>}
      {activeTask?.otp && <div className="rounded-2xl border-2 border-ink bg-sun p-4 text-center"><div className="mono text-xs uppercase">Door OTP</div><div className="display text-6xl tracking-[0.2em]">{activeTask.otp}</div><p className="text-sm font-semibold">Share only with the helper at your door.</p></div>}
      {live?.line && <p className="rounded-xl bg-paper p-3 font-semibold">{live.line}</p>}
      <div className="flex gap-2" role="tablist">{(["timeline", "map", "chat"] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} className="chip capitalize" aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === "map" && (
        <div><PulseMap boundary={map.boundary} gates={map.gates} towers={map.towers} helpers={live?.helper ? [{ id: "h", name: live.helper.name, lat: live.helper.lat, lng: live.helper.lng, label: live.helper.name }] : []} me={map.me ? { lat: map.me.lat, lng: map.me.lng, label: "ghar" } : undefined} highlightTower={map.me?.tower} className="border-2 border-ink" /><p className="mt-2 text-xs opacity-70">Smoothed position, delayed by 5 seconds. Gate pass chip: sent to guard.</p></div>
      )}
      {tab === "chat" && <div className="space-y-3"><Chat threadKey={`plan:${plan.id}`} title="Shell team" />{activeTask && <Chat threadKey={`task:${activeTask.id}`} title={`${activeTask.helper?.name.split(" ")[0] ?? "Helper"}, ${activeTask.name}`} />}<button className="btn btn-ghost btn-sm" onClick={() => alert("Masked call: connecting through a Shell number so your number stays private (demo).")}>Call (masked)</button></div>}

      {tab === "timeline" && tasks.map((t) => <TaskCard key={t.id} t={t} onDone={() => router.refresh()} />)}

      <div className="rounded-2xl border-2 border-dashed border-brick p-3 text-center">
        {sos === "idle" && <button className="btn w-full bg-brick text-cream" style={{ borderColor: "#51170c", boxShadow: "0 4px 0 #51170c" }} onPointerDown={() => { holdRef.current = setTimeout(() => { setSos("countdown"); setCd(5); }, 2000); }} onPointerUp={() => clearTimeout(holdRef.current)} onPointerLeave={() => clearTimeout(holdRef.current)}>SOS: dabake rakho (2 sec)</button>}
        {sos === "countdown" && <div><p className="font-bold">Location Shell aur aapke trusted contact ko bhej rahe hain... {cd}s</p><button className="btn btn-cream btn-sm mt-2" onClick={() => setSos("idle")}>Galti se dabaya, cancel</button></div>}
        {sos === "sent" && <p className="font-bold text-brick">SOS bhej diya. Shell team, guard aur trusted contact ko alert gaya. Hum 20 second mein jaag jaate hain.</p>}
        <p className="mt-2 text-xs">Kuch bhi galat lage to SOS dabao. Hum 20 second mein jaag jaate hain. Phone 3 baar hilao to bhi SOS.</p>
      </div>
      <Link href="/app/orders" className="link-quiet block text-center text-sm font-bold">Saare orders</Link>
    </div>
  );
}

function TaskCard({ t, onDone }: { t: TTask; onDone: () => void }) {
  const [review, setReview] = useState(false);
  const [rework, setRework] = useState(false);
  const [sel, setSel] = useState<number[]>([]);
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>(["on time"]);
  const [tip, setTip] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [rejected, setRejected] = useState<number[]>([]);
  const act = async (action: string, body: unknown = {}) => { setBusy(true); const r = await send(`/api/tasks/${t.id}/${action}`, body); setBusy(false); if (!r.ok) setMsg(r.error ?? "Error"); else { setMsg(""); onDone(); } return r; };
  return (
    <div className="rounded-2xl border-2 border-ink bg-paper p-3">
      <div className="flex items-center justify-between gap-2"><b className="display text-xl">{t.name}</b><span className="relative"><span className="chip !min-h-0 !py-0.5 text-xs">{LABEL[t.status] ?? t.status}</span>{t.status === "approved" && <span className="absolute -right-2 -top-3"><Stamp label="OK" rot={-8} delay={0} /></span>}</span></div>
      <div className="mono text-xs opacity-70">{inr(t.price)} · {t.start ? fmtDateTime(t.start) : "time tbd"}</div>
      {t.helper && <div className="mt-2"><HelperCard h={t.helper} compact /></div>}
      {t.checklist.length > 0 && ["in_progress", "awaiting_approval", "approved"].includes(t.status) && <ul className="mt-2 space-y-1 text-sm">{t.checklist.map((c, i) => <li key={i} className="flex items-center gap-2"><Tick on={c.done} size={18} color={c.done ? "var(--color-euc)" : "rgba(0,0,0,.25)"} />{c.label}</li>)}</ul>}
      {t.changes.map((c) => <div key={c.id} className="mt-2 rounded-xl bg-sand p-2 text-sm"><b>Change request:</b> {c.kind === "extra_time" ? `${c.minutes} more minutes` : "extra task"}, price +{inr(c.delta)}<div className="mt-1 flex gap-2"><button className="btn btn-forest btn-sm" onClick={() => act("change_respond", { eventId: c.id, accept: true })}>Haan</button><button className="btn btn-ghost btn-sm" onClick={() => act("change_respond", { eventId: c.id, accept: false })}>Nahi</button></div></div>)}
      {t.expense && t.expense.status === "receipt_uploaded" && (
        <div className="mt-2 rounded-xl bg-cream p-2 text-sm"><b>Receipt:</b> {inr(t.expense.spent)} of {inr(t.expense.cap)} cap
          <ul className="mt-1">{t.expense.items.map((i, k) => <li key={k} className="flex items-center justify-between"><label className="flex items-center gap-2"><input type="checkbox" checked={!rejected.includes(k)} onChange={() => setRejected(rejected.includes(k) ? rejected.filter((x) => x !== k) : [...rejected, k])} />{i.name}</label><span className="mono">{inr(i.amount)}</span></li>)}</ul>
          <button className="btn btn-forest btn-sm mt-2" onClick={() => act("expense_approve", { rejected })}>Approve lines</button></div>
      )}
      {t.status === "awaiting_approval" && (
        <div className="mt-3 space-y-3">
          {t.before && t.after && <TimeMachine before={t.before} after={t.after} />}
          {!review && !rework && <div className="flex gap-2"><button className="btn btn-sun flex-1" disabled={busy} onClick={async () => { await act("approve"); setReview(true); }}>Sab theek hai</button>{t.canRework && <button className="btn btn-cream flex-1" onClick={() => setRework(true)}>Rework chahiye</button>}</div>}
          {rework && <div className="rounded-xl bg-cream p-3"><p className="text-sm font-bold">Kya theek karwana hai?</p>{t.checklist.map((c, i) => <label key={i} className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" checked={sel.includes(i)} onChange={() => setSel(sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i])} />{c.label}</label>)}<textarea className="field mt-2" placeholder="Notes" value={note} onChange={(e) => setNote(e.target.value)} /><p className="mt-1 text-xs">Koi baat nahi, hum theek kar denge. Pehle 24 ghante mein.</p><button className="btn btn-forest btn-sm mt-2" onClick={() => act("rework", { items: sel, note })}>Rework bhejo</button></div>}
        </div>
      )}
      {(review || (t.status === "approved" && !t.reviewed)) && !t.reviewed && (
        <div className="mt-3 space-y-2 rounded-xl bg-cream p-3">
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((n) => <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} stars`} className={`h-10 w-10 rounded-full border-2 border-ink font-bold ${rating >= n ? "bg-sun" : "bg-paper"}`} onClick={() => setRating(n)}>{n}</button>)}</div>
          <div className="flex flex-wrap gap-1.5">{["on time", "polite", "careful", "thorough"].map((g) => <button key={g} className="chip !min-h-0 !py-1 text-xs" aria-pressed={tags.includes(g)} onClick={() => setTags(tags.includes(g) ? tags.filter((x) => x !== g) : [...tags, g])}>{g}</button>)}</div>
          <div className="flex flex-wrap items-center gap-1.5"><span className="text-xs font-bold">Tip (100% helper ko):</span>{[0, 2000, 5000, 10000].map((n) => <button key={n} className="chip !min-h-0 !py-1 text-xs" aria-pressed={tip === n} onClick={() => setTip(n)}>{n ? inr(n) : "No"}</button>)}</div>
          <div className="note !p-3"><label className="hand block text-xl" htmlFor={`sn-${t.id}`}>Shell Note</label><textarea id={`sn-${t.id}`} className="hand w-full bg-transparent text-xl outline-none" maxLength={140} rows={2} placeholder="Thank you..." value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <button className="btn btn-forest btn-sm" disabled={busy} onClick={async () => { const r = await act("review", { rating, tags, tip, shellNote: note || undefined }); if (r.ok) { track("review_submitted"); setReview(false); } }}>Rating bhejo</button>
        </div>
      )}
      {t.status === "approved" && t.reviewed && <p className="mt-2 text-sm font-semibold">Ghar ready. Aap bas aaiye. <Link className="link-quiet" href={`/app/disputes?task=${t.id}`}>Problem report karo</Link></p>}
      {msg && <p role="alert" className="mt-2 text-sm font-semibold text-brick">{msg}</p>}
    </div>
  );
}
