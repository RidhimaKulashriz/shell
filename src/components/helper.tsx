"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { post, useToast, ActionButton, compressImage } from "./client";
import { Icon } from "./icons";
import { CATALOG } from "@/lib/catalog";
import { TRAINING } from "@/lib/content";
import { cn } from "@/lib/utils";

export function OnlineToggle({ online, rush, active }: { online: boolean; rush: boolean; active: boolean }) {
  const router = useRouter(); const { show, node } = useToast();
  const set = async (b: Record<string, unknown>) => { try { await post("/api/helper", b); router.refresh(); } catch (e) { show((e as Error).message, "err"); } };
  return (
    <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
      <div><div className="text-xs font-bold uppercase tracking-wider text-euca">Availability</div><div className="serif text-2xl font-semibold">{online ? "You're online" : "You're offline"}</div><p className="text-sm text-ink/60">{online ? "Offers will appear below." : "Go online to receive offers."}</p></div>
      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={rush} onChange={(e) => set({ action: "rush", on: e.target.checked })} />Rush jobs</label>
        <button role="switch" aria-checked={online} aria-label="Online status" disabled={!active} onClick={() => set({ action: "online", online: !online })} className={cn("relative h-12 w-24 rounded-full transition-colors disabled:opacity-50", online ? "bg-euca" : "bg-line")}><span className={cn("absolute top-1 h-10 w-10 rounded-full bg-white shadow transition-all", online ? "left-[3.2rem]" : "left-1")} /></button>
      </div>{node}
    </div>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; const SLOTS = ["morning", "afternoon", "evening"];
const STEP_TITLES = ["Basics", "Identity", "College ID", "Selfie check", "Skills", "Availability", "Payout"];

export function ApplyWizard({ start, name, saved }: { start: number; name: string; saved: Record<string, any> }) {
  const router = useRouter(); const { show, node } = useToast(); const [step, setStep] = useState(Math.min(start, 7)); const [busy, setBusy] = useState(false);
  const [b, setB] = useState({ name: saved.step1?.name ?? name, dob: saved.step1?.dob ?? "", gender: saved.step1?.gender ?? "unspecified", college: saved.step1?.college ?? "", occupation: saved.step1?.occupation ?? "student", languages: (saved.step1?.languages ?? ["English", "Hindi"]) as string[] });
  const [cats, setCats] = useState<string[]>(saved.step5?.categories ?? []); const [bio, setBio] = useState(saved.step5?.bio ?? "");
  const [av, setAv] = useState<Record<string, string[]>>(saved.step6?.availability ?? { Sat: ["morning"], Sun: ["morning"] }); const [radius, setRadius] = useState(saved.step6?.radiusM ?? 3000);
  const [upi, setUpi] = useState(""); const [agree, setAgree] = useState(false); const [read, setRead] = useState(false); const [files, setFiles] = useState<Record<string, boolean>>({});
  const next = async (data: unknown) => { setBusy(true); try { await post("/api/helper", { action: "apply_step", step, data }); if (step === 7) { router.refresh(); return; } setStep(step + 1); } catch (e) { show((e as Error).message, "err"); } finally { setBusy(false); } };
  const Nav = ({ onNext, label = "Save and continue", ok = true }: { onNext: () => void; label?: string; ok?: boolean }) => <div className="mt-6 flex gap-3">{step > 1 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}<button className="btn btn-primary flex-1" disabled={busy || !ok} onClick={onNext}>{busy ? "Saving…" : label}</button></div>;
  return (
    <div className="mx-auto max-w-xl">
      <ol className="mb-6 flex gap-1" aria-label="Application progress">{STEP_TITLES.map((t, i) => <li key={t} className="flex-1"><div className={cn("h-1.5 rounded-full", i + 1 <= step ? "bg-tide" : "bg-line")} /><span className={cn("mt-1 hidden text-[0.65rem] sm:block", i + 1 === step ? "font-bold text-tide" : "text-ink/40")}>{t}</span></li>)}</ol>
      <p className="text-sm text-ink/60">Step {step} of 7. Your progress is saved after every step.</p>
      <div className="card mt-2 space-y-4 p-5">
        <h2 className="text-2xl font-semibold text-tide">{STEP_TITLES[step - 1]}</h2>
        {step === 1 && <><div><label className="label" htmlFor="a-n">Full name</label><input id="a-n" className="input" value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} /></div>
          <div className="grid gap-3 sm:grid-cols-2"><div><label className="label" htmlFor="a-d">Date of birth</label><input id="a-d" type="date" className="input" value={b.dob} onChange={(e) => setB({ ...b, dob: e.target.value })} /></div><div><label className="label" htmlFor="a-g">Gender (used only for matching preferences)</label><select id="a-g" className="input" value={b.gender} onChange={(e) => setB({ ...b, gender: e.target.value })}><option value="unspecified">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option></select></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><div><label className="label" htmlFor="a-c">College or workplace</label><input id="a-c" className="input" value={b.college} onChange={(e) => setB({ ...b, college: e.target.value })} /></div><div><label className="label" htmlFor="a-o">I am a</label><select id="a-o" className="input" value={b.occupation} onChange={(e) => setB({ ...b, occupation: e.target.value })}><option value="student">Student</option><option value="freelancer">Freelancer</option><option value="homemaker">Homemaker</option></select></div></div>
          <div><div className="label">Languages you speak</div><div className="flex flex-wrap gap-2">{["English", "Hindi", "Punjabi", "Marathi", "Telugu", "Tamil", "Malayalam", "Bengali"].map((l) => <button key={l} className="chip" aria-pressed={b.languages.includes(l)} onClick={() => setB({ ...b, languages: b.languages.includes(l) ? b.languages.filter((x) => x !== l) : [...b.languages, l] })}>{l}</button>)}</div></div>
          <p className="text-xs text-ink/50">You must be 18 or older.</p><Nav onNext={() => next(b)} /></>}
        {step === 2 && <><p className="text-ink/70">We verify your government ID through a certified provider (DigiLocker or offline e-KYC). We never store your Aadhaar number. We keep only a reference and a verified flag.</p><div className="rounded-xl bg-cream p-4 text-sm"><Icon name="shield" className="mb-1 text-euca" />Demo mode: tapping Verify simulates a successful check.</div><Nav onNext={() => next({ provider: "demo" })} label="Verify with DigiLocker" /></>}
        {step === 3 && <><p className="text-ink/70">Upload clear photos of both sides of your college or work ID.</p>{["Front", "Back"].map((s) => <label key={s} className="flex cursor-pointer items-center justify-between rounded-xl border-[1.5px] border-dashed border-euca/50 p-4 text-sm"><span><Icon name="upload" className="mr-2 inline text-euca" />{s} of ID</span>{files[s] ? <span className="pill">Added</span> : <span className="text-ink/50">Tap to add</span>}<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={() => setFiles({ ...files, [s]: true })} /></label>)}<Nav onNext={() => next({ front: true, back: true })} ok={!!files.Front && !!files.Back} /></>}
        {step === 4 && <><p className="text-ink/70">Take a quick selfie. We compare it with your ID photo to make sure it&apos;s really you.</p><label className="flex cursor-pointer items-center justify-between rounded-xl border-[1.5px] border-dashed border-euca/50 p-4 text-sm"><span><Icon name="camera" className="mr-2 inline text-euca" />Take a selfie</span>{files.selfie ? <span className="pill">Added</span> : <span className="text-ink/50">Tap to open camera</span>}<input type="file" accept="image/*" capture="user" className="sr-only" onChange={() => setFiles({ ...files, selfie: true })} /></label><Nav onNext={() => next({ selfie: true })} ok={!!files.selfie} /></>}
        {step === 5 && <><div className="flex flex-wrap gap-2">{CATALOG.map((c) => <button key={c.slug} className="chip" aria-pressed={cats.includes(c.slug)} onClick={() => setCats(cats.includes(c.slug) ? cats.filter((x) => x !== c.slug) : [...cats, c.slug])}><Icon name={c.icon} size={16} />{c.name}</button>)}</div><div><label className="label" htmlFor="a-b">A line about you (shown to customers)</label><textarea id="a-b" rows={2} className="input" value={bio} onChange={(e) => setBio(e.target.value)} /></div><Nav onNext={() => next({ categories: cats, bio })} ok={cats.length > 0} /></>}
        {step === 6 && <><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="p-1 text-left" /> {SLOTS.map((s) => <th key={s} className="p-1 capitalize">{s}</th>)}</tr></thead><tbody>{DAYS.map((d) => <tr key={d}><td className="p-1 font-semibold">{d}</td>{SLOTS.map((s) => { const on = av[d]?.includes(s); return <td key={s} className="p-1 text-center"><button aria-label={`${d} ${s}`} aria-pressed={!!on} className={cn("h-9 w-full rounded-lg border-[1.5px]", on ? "border-tide bg-tide text-cream" : "border-line bg-white")} onClick={() => setAv({ ...av, [d]: on ? av[d].filter((x) => x !== s) : [...(av[d] ?? []), s] })}>{on ? "✓" : ""}</button></td>; })}</tr>)}</tbody></table></div>
          <div><label className="label" htmlFor="a-r">Travel radius: {(radius / 1000).toFixed(1)} km</label><input id="a-r" type="range" min={500} max={6000} step={500} value={radius} onChange={(e) => setRadius(+e.target.value)} className="w-full accent-[#235347]" /></div><Nav onNext={() => next({ availability: av, radiusM: radius })} /></>}
        {step === 7 && <><div><label className="label" htmlFor="a-u">UPI ID for payouts</label><input id="a-u" className="input" placeholder="name@bank" value={upi} onChange={(e) => setUpi(e.target.value)} /><p className="mt-1 text-xs text-ink/50">We verify it with a ₹1 test transfer.</p></div>
          <div><div className="label">Helper Agreement and Safety Policy</div><div className="h-32 overflow-y-auto rounded-xl border border-line bg-bone p-3 text-sm text-ink/70" onScroll={(e) => { const t = e.currentTarget; if (t.scrollTop + t.clientHeight >= t.scrollHeight - 8) setRead(true); }}><p>You must be 18 or older and keep ID details accurate.</p><p className="mt-2">Never share personal phone numbers or arrange work outside Shell.</p><p className="mt-2">Always use the customer&apos;s door code before starting.</p><p className="mt-2">Never take on massage, makeup, personal care or homework.</p><p className="mt-2">You are an independent worker and choose your hours.</p><p className="mt-2">Rule breaks lead to documented strikes, and you can appeal once.</p><p className="mt-2">Payouts are weekly and free, or instant for a small fee. Tips are 100% yours.</p><p className="mt-2">Press SOS if you ever feel unsafe.</p></div></div>
          <label className={cn("flex items-center gap-2 text-sm", !read && "opacity-50")}><input type="checkbox" className="h-4 w-4" disabled={!read} checked={agree} onChange={(e) => setAgree(e.target.checked)} />I have read and accept both. {!read && <span className="text-xs">(Scroll to the end first)</span>}</label>
          <Nav onNext={() => next({ upi, agree })} label="Submit application" ok={agree} /></>}
      </div>{node}
    </div>
  );
}

const TRACK = ["Submitted", "Documents under review", "Verification complete", "Training", "Active"];
export function StatusTracker({ status }: { status: string }) {
  const idx = status === "review" ? 1 : status === "training" || status === "shadow" ? 3 : status === "active" ? 4 : 0;
  return <ol className="space-y-3">{TRACK.map((t, i) => <li key={t} className="flex items-center gap-3"><span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-bold", i < idx ? "bg-euca text-white" : i === idx ? "bg-sun text-tide" : "bg-line text-ink/40")}>{i < idx ? "✓" : i + 1}</span><span className={i <= idx ? "font-semibold" : "text-ink/50"}>{t}</span></li>)}</ol>;
}

export function TrainingModule({ mod, done }: { mod: "safety" | "general"; done: boolean }) {
  const router = useRouter(); const { show, node } = useToast(); const t = TRAINING[mod]; const [open, setOpen] = useState(false); const [i, setI] = useState(0); const [ans, setAns] = useState<number[]>([]); const [phase, setPhase] = useState<"cards" | "quiz">("cards");
  if (!open) return <div className="card flex items-center justify-between gap-3 p-4"><div><div className="font-semibold">{t.title}</div><div className="text-xs text-ink/50">{t.cards.length} short cards · {t.quiz.length}-question quiz · pass mark 80%</div></div>{done ? <span className="pill">Passed</span> : <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Start</button>}{node}</div>;
  if (phase === "cards") return <div className="card space-y-4 p-5"><div className="text-xs text-ink/50">Card {i + 1} of {t.cards.length}</div><p className="serif text-xl">{t.cards[i]}</p><div className="flex gap-2">{i > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setI(i - 1)}>Back</button>}<button className="btn btn-primary btn-sm" onClick={() => (i + 1 < t.cards.length ? setI(i + 1) : (setPhase("quiz"), setI(0)))}>{i + 1 < t.cards.length ? "Next" : "Start quiz"}</button></div>{node}</div>;
  const q = t.quiz[i];
  return <div className="card space-y-3 p-5"><div className="text-xs text-ink/50">Question {i + 1} of {t.quiz.length}</div><p className="text-lg font-semibold">{q.q}</p>{q.o.map((o, k) => <button key={k} className="chip !w-full !justify-start" onClick={async () => { const next = [...ans, k]; setAns(next); if (i + 1 < t.quiz.length) return setI(i + 1); const score = next.filter((a, n) => a === t.quiz[n].a).length / t.quiz.length; try { const r = await post<{ activated: boolean }>("/api/helper", { action: "training_done", module: mod, score }); show(r.activated ? "Passed. You're now active!" : "Passed. Well done."); router.refresh(); } catch (e) { show((e as Error).message, "err"); setOpen(false); setPhase("cards"); setI(0); setAns([]); } }}>{o}</button>)}{node}</div>;
}

export function TrackingBeacon({ taskId }: { taskId: string }) {
  const [on, setOn] = useState(false); const buf = useRef<any[]>([]); const lastSent = useRef(0);
  useEffect(() => {
    if (!navigator.geolocation) return;
    let battery: number | undefined; (navigator as any).getBattery?.().then((b: any) => { battery = Math.round(b.level * 100); }).catch(() => {});
    const id = navigator.geolocation.watchPosition((p) => {
      setOn(true); buf.current.push({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, speed: p.coords.speed ?? 0, battery });
      const gap = (p.coords.speed ?? 0) > 1 ? 10000 : battery !== undefined && battery < 20 ? 60000 : 30000; // adaptive
      if (Date.now() - lastSent.current > gap) { lastSent.current = Date.now(); const pings = buf.current.splice(0); post("/api/helper/location", { taskId, pings }).catch(() => buf.current.unshift(...pings)); }
    }, () => setOn(false), { enableHighAccuracy: true, maximumAge: 5000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [taskId]);
  return <div className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2 text-xs"><span className={cn("h-2 w-2 rounded-full", on ? "animate-pulse bg-euca" : "bg-sun")} />{on ? "Location is being shared for this job only. It stops when you check out." : "Turn on location so the customer can follow your arrival. It only runs during this job."}</div>;
}

export function JobControls({ job }: { job: { id: string; status: string; checklist: { label: string; done: boolean }[]; cap: number; hasExpense: boolean; before: number; after: number } }) {
  const router = useRouter(); const { show, node } = useToast(); const [otp, setOtp] = useState(""); const [busy, setBusy] = useState(false); const [mins, setMins] = useState(30); const [note, setNote] = useState(""); const [summary, setSummary] = useState(""); const [items, setItems] = useState([{ name: "", amount: "" }]);
  const run = async (action: string, body: unknown = {}, msg?: string) => { setBusy(true); try { let loc = {}; if (action === "checkin" && navigator.geolocation) loc = await new Promise((r) => navigator.geolocation.getCurrentPosition((p) => r({ lat: p.coords.latitude, lng: p.coords.longitude }), () => r({}), { timeout: 3000 })); await post(`/api/tasks/${job.id}/${action}`, { ...(body as object), ...loc }); if (msg) show(msg); router.refresh(); } catch (e) { show((e as Error).message, "err"); } finally { setBusy(false); } };
  const photo = (kind: "before" | "after") => (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) compressImage(f).then((url) => run("photo", { kind, url }, "Photo added")); };
  const s = job.status;
  return (
    <div className="space-y-4">
      {s === "accepted" && <button className="btn btn-primary w-full" disabled={busy} onClick={() => run("enroute", {}, "On your way. The customer has been told.")}>Start trip</button>}
      {["accepted", "en_route", "arrived"].includes(s) && <div className="card space-y-3 p-4"><h3 className="font-semibold">Check in at the door</h3><p className="text-sm text-ink/60">Ask the customer for the 4-digit door code. You must be within about 150 metres of the address.</p><label className="sr-only" htmlFor="otp">Door code</label><input id="otp" className="input text-center text-2xl tracking-[0.5em]" inputMode="numeric" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••" /><button className="btn btn-primary w-full" disabled={busy || otp.length < 4} onClick={() => run("checkin", { otp }, "Checked in. Job started.")}>Check in and start</button></div>}
      {s === "rework" && <button className="btn btn-primary w-full" disabled={busy} onClick={() => run("restart", {}, "Rework started")}>Start rework</button>}
      {s === "in_progress" && <>
        <div className="card p-4"><h3 className="mb-3 font-semibold">Checklist</h3><ul className="space-y-2">{job.checklist.map((c, i) => <li key={i}><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 text-sm"><input type="checkbox" className="h-5 w-5 accent-[#235347]" checked={c.done} onChange={(e) => run("checklist", { index: i, done: e.target.checked })} /><span className={c.done ? "text-ink/50 line-through" : ""}>{c.label}</span></label></li>)}</ul></div>
        <div className="card space-y-3 p-4"><h3 className="font-semibold">Photos</h3><p className="text-xs text-ink/60">Take before and after photos from the same angle, in good light.</p><div className="grid grid-cols-2 gap-3">{(["before", "after"] as const).map((k) => <label key={k} className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-[1.5px] border-dashed border-euca/50 p-4 text-sm capitalize"><Icon name="camera" className="text-euca" />{k} ({job[k]})<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={photo(k)} /></label>)}</div></div>
        {job.cap > 0 && !job.hasExpense && <div className="card space-y-3 p-4"><h3 className="font-semibold">Upload receipt items</h3><p className="text-xs text-ink/60">Customer cap: ₹{Math.round(job.cap / 100)}. Enter each line from the bill.</p>{items.map((it, i) => <div key={i} className="flex gap-2"><input className="input" placeholder="Item" aria-label="Item" value={it.name} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /><input className="input !w-28" placeholder="₹" inputMode="decimal" aria-label="Amount" value={it.amount} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} /></div>)}<div className="flex gap-2"><button className="btn btn-ghost btn-sm" onClick={() => setItems([...items, { name: "", amount: "" }])}>Add line</button><button className="btn btn-primary btn-sm" disabled={busy} onClick={() => run("expense", { items: items.filter((x) => x.name && x.amount) }, "Receipt sent for approval")}>Send receipt</button></div></div>}
        <div className="card space-y-3 p-4"><h3 className="font-semibold">Need more time?</h3><div className="flex flex-wrap gap-2">{[30, 60, 90].map((m) => <button key={m} className="chip" aria-pressed={mins === m} onClick={() => setMins(m)}>{m} min</button>)}</div><input className="input" placeholder="Why? (for example, extra rooms)" aria-label="Reason" value={note} onChange={(e) => setNote(e.target.value)} /><button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run("request_change", { type: "extra_time", minutes: mins, note }, "Request sent to the customer")}>Send request</button></div>
        <div className="card space-y-3 p-4"><h3 className="font-semibold">Finish</h3><textarea className="input" rows={2} placeholder="Summary of what you did (optional)" aria-label="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} /><button className="btn btn-sun w-full" disabled={busy} onClick={() => run("checkout", { summary }, "Checked out. Waiting for the customer to approve.")}>Check out</button><button className="text-xs underline" onClick={() => run("checkout", { summary, partial: true })}>Mark as partially done</button></div></>}
      {s === "awaiting_approval" && <div className="rounded-2xl bg-cream p-4 text-sm"><strong>Waiting for the customer to approve.</strong> You&apos;ll be paid as soon as they do, or automatically 2 hours after you checked out.</div>}
      {["accepted", "en_route"].includes(s) && <ActionButton url={`/api/tasks/${job.id}/cancel`} body={{}} confirm="Cancel this job? We'll find a replacement. Frequent cancellations affect your offers." className="btn btn-ghost btn-sm">I can&apos;t do this job</ActionButton>}
      {node}
    </div>
  );
}
