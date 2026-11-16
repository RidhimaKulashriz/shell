"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { track } from "@/lib/analytics";

type Mode = "text" | "voice" | "photo";
type Photo = { url: string; caption: string };
const CHIPS = ["cleaning", "groceries", "wardrobe", "party decoration", "bartan", "parcel"];

async function compress(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const s = Math.min(1, 1024 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.7);
}

export function HomeComposer({ prefill = "", greeting }: { prefill?: string; greeting?: string }) {
  const [open, setOpen] = useState<Mode | null>(prefill ? "text" : null);
  return (
    <>
      <div className="rounded-2xl border border-ink/20 bg-paper p-4 shadow-[0_22px_44px_-30px_rgba(5,31,32,0.6)]">
        {greeting && <p className="hand text-2xl text-euc">{greeting}</p>}
        <button className="field mt-2 text-left opacity-80" onClick={() => { track("composer_opened"); setOpen("text"); }}>What do you need done? Write it in your own words.</button>
        <div className="mt-3 flex gap-2">
          {([["text", "Type", "chat"], ["voice", "Voice", "mic"], ["photo", "Photo", "camera"]] as const).map(([m, l, ic]) => <button key={m} onClick={() => { track("composer_opened", { mode: m }); setOpen(m); }} className="btn btn-cream btn-sm flex-1"><Icon name={ic} size={22} tone="none" />{l}</button>)}
        </div>
      </div>
      {open && <ComposerSheet mode={open} prefill={prefill} onClose={() => setOpen(null)} />}
    </>
  );
}

function ComposerSheet({ mode: m0, prefill, onClose }: { mode: Mode; prefill: string; onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(m0);
  const [text, setText] = useState(prefill);
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [asap, setAsap] = useState(true);
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const recRef = useRef<any>(null);
  useEffect(() => { if (!rec) return; const id = setInterval(() => setSecs((s) => { if (s >= 59) { stop(); return 60; } return s + 1; }), 1000); return () => clearInterval(id); }, [rec]);
  function start() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setErr("Voice input is not supported in this browser. Please type instead."); return; }
    const r = new SR(); r.lang = "hi-IN"; r.interimResults = true; r.continuous = true;
    r.onresult = (e: any) => setText(Array.from(e.results).map((x: any) => x[0].transcript).join(" "));
    r.onend = () => setRec(false);
    recRef.current = r; setSecs(0); setRec(true); r.start();
  }
  function stop() { try { recRef.current?.stop(); } catch {} setRec(false); }
  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const next = [...photos];
    for (const f of Array.from(files).slice(0, 5 - photos.length)) next.push({ url: await compress(f), caption: "" });
    setPhotos(next);
  };
  const submit = async () => {
    setBusy(true); setErr("");
    const r = await fetch("/api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: text || (photos.length ? "Review the photos" : ""), photos: photos.map((p) => ({ url: p.url, caption: p.caption })), deadlineAt: !asap && when ? new Date(when).toISOString() : undefined, voiceTranscript: mode === "voice" ? text : undefined }) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(j.error?.message ?? "Something went wrong. Please try again."); return; }
    track("request_submitted", { mode });
    router.push(`/app/request/${j.id}`);
  };
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-cream" role="dialog" aria-modal="true" aria-label="Tell Shell">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-y-auto p-4">
        <div className="flex items-center justify-between"><h2 className="display text-3xl">Tell Shell</h2><button className="grid h-11 w-11 place-items-center rounded-full border border-ink/20" onClick={onClose} aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 5 19 19M19 5 5 19" /></svg></button></div>
        <div className="mt-3 flex gap-2" role="tablist">{(["text", "voice", "photo"] as const).map((x) => <button key={x} role="tab" aria-selected={mode === x} onClick={() => setMode(x)} className={`rounded-full border border-ink/20 px-4 py-1.5 font-bold capitalize ${mode === x ? "bg-forest text-cream" : "bg-paper"}`}>{x}</button>)}</div>
        {mode === "voice" && (
          <div className="mt-4 rounded-2xl bg-paper p-4 text-center">
            <div className="flex h-14 items-center justify-center gap-[3px]" aria-hidden>{Array.from({ length: 30 }, (_, i) => <span key={i} className="w-1.5 rounded-full bg-forest" style={{ height: rec ? `${20 + ((i * 41 + secs * 13) % 75)}%` : "12%", transition: "height .25s" }} />)}</div>
            <button className={`btn mt-3 ${rec ? "btn-sun" : "btn-forest"}`} onPointerDown={start} onPointerUp={stop} onPointerLeave={() => rec && stop()} aria-label="Hold to record">{rec ? `Recording ${secs}s / 60s` : "Dabake bolo"}</button>
            <p className="mt-2 text-xs opacity-70">Hold to record, up to 60 seconds. Transcript neeche edit kar sakte ho.</p>
          </div>
        )}
        {mode === "photo" && (
          <div className="mt-4 space-y-3">
            <label className="btn btn-cream cursor-pointer"><Icon name="camera" size={22} tone="none" /> Photo chuno ({photos.length}/5)<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addPhotos(e.target.files)} /></label>
            {photos.map((p, i) => <div key={i} className="flex gap-3 rounded-2xl bg-paper p-2">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.url} alt={`Photo ${i + 1}`} className="h-20 w-20 rounded-xl object-cover" /><input className="field" placeholder="What should we do here?" value={p.caption} onChange={(e) => setPhotos(photos.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} /><button aria-label="Remove photo" className="px-2" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>×</button></div>)}
          </div>
        )}
        <label htmlFor="cmp-text" className="sr-only">Message</label>
        <textarea id="cmp-text" className="field mt-4 min-h-[140px]" placeholder="What do you need done? Write it in your own words." value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-2 flex flex-wrap gap-2">{CHIPS.map((c) => <button key={c} className="chip" onClick={() => setText((t) => (t ? t + ", " : "") + c)}>{c}</button>)}</div>
        <fieldset className="mt-4"><legend className="font-bold">When do you need it by?</legend><div className="mt-2 flex flex-wrap items-center gap-2"><button className="chip" aria-pressed={asap} onClick={() => setAsap(true)}>ASAP</button><button className="chip" aria-pressed={!asap} onClick={() => setAsap(false)}>Date and time</button>{!asap && <input type="datetime-local" className="field !w-auto" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Deadline" />}</div></fieldset>
        {err && <p role="alert" className="mt-3 font-semibold text-brick">{err}</p>}
      </div>
      <div className="border-t border-ink/20 bg-paper p-4"><div className="mx-auto max-w-2xl"><button className="btn btn-sun w-full" disabled={busy || (!text.trim() && !photos.length)} onClick={submit}>{busy ? "Sending..." : "Send to Shell"}</button></div></div>
    </div>
  );
}
