"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Countdown, HandCircle } from "@/components/ui";
import { track } from "@/lib/analytics";

type Q = { id: string; q: string; qHi: string; chips: string[]; answer?: string };
type Photo = { url: string; caption?: string; circles?: { x: number; y: number; label: string }[] };

export function RequestFlow({ id, text, questions, status, slaDueAt, photos, needsHuman, banned }: { id: string; text: string; questions: Q[]; status: string; slaDueAt: string | null; photos: Photo[]; needsHuman: boolean; banned: string[] }) {
  const [qs, setQs] = useState(questions);
  const [done, setDone] = useState(status !== "clarifying");
  const [free, setFree] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const idx = qs.findIndex((q) => !q.answer);
  const cur = idx >= 0 ? qs[idx] : null;
  const answer = async (a: string) => {
    if (!cur) return;
    setQs(qs.map((q) => (q.id === cur.id ? { ...q, answer: a } : q)));
    setFree("");
    const r = await fetch(`/api/requests/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId: cur.id, answer: a }) });
    const j = await r.json();
    track("question_answered");
    if (j.done) setDone(true);
  };
  const skip = async () => { await fetch(`/api/requests/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ skip: true }) }); setDone(true); };
  useEffect(() => {
    if (!done) return;
    const t = setInterval(async () => { const r = await fetch(`/api/requests/${id}`); const j = await r.json(); if (j.planId) { setPlanId(j.planId); clearInterval(t); } }, 6000);
    return () => clearInterval(t);
  }, [done, id]);
  return (
    <div className="space-y-4">
      <h1 className="display text-3xl">{done ? "Building your plan" : "A few questions"}</h1>
      <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-forest p-3 text-cream">{text}</div>
      {banned.length > 0 && <p className="rounded-xl bg-sand p-3 text-sm">Some items ({banned.join(", ")}) are not offered by Shell. We will plan the rest.</p>}
      {photos.map((p, i) => (
        <div key={i} className="relative overflow-hidden rounded-2xl border border-ink/20">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.url} alt={p.caption || `Photo ${i + 1}`} className="w-full" />
          {p.circles?.map((c, j) => <div key={j} className="pointer-events-none absolute" style={{ left: `${c.x - 10}%`, top: `${c.y - 8}%`, width: "26%", height: "20%" }}><HandCircle className="inset-0 h-full w-full" delay={j * 500} /><span className="hand absolute left-0 top-full whitespace-nowrap bg-paper/90 px-1 text-sm">{c.label}</span></div>)}
        </div>
      ))}
      {qs.filter((q) => q.answer).map((q) => <div key={q.id} className="space-y-1"><div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-paper p-3">{q.q}</div><div className="ml-auto max-w-[70%] rounded-2xl rounded-br-sm bg-sand p-3 font-semibold">{q.answer}</div></div>)}
      {!done && cur && (
        <div className="space-y-3">
          <div className="flex gap-1.5" aria-label={`${qs.length - idx} questions left`}>{qs.map((q, i) => <span key={q.id} className={`h-2.5 w-2.5 rounded-full border border-ink/20 ${i < idx ? "bg-forest" : i === idx ? "bg-sun" : "bg-paper"}`} />)}</div>
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-paper p-3 font-semibold">{cur.q}</div>
          <div className="flex flex-wrap gap-2">{cur.chips.map((c) => <button key={c} className="chip" onClick={() => answer(c)}>{c}</button>)}</div>
          <div className="flex gap-2"><input className="field" placeholder="Or type your own" value={free} onChange={(e) => setFree(e.target.value)} /><button className="btn btn-forest btn-sm" disabled={!free} onClick={() => answer(free)}>Bhejo</button></div>
          <button className="link-quiet text-sm font-bold" onClick={skip}>Skip, you decide</button>
        </div>
      )}
      {done && (
        <div className="rounded-2xl border border-ink/20 bg-paper p-5 text-center">
          <svg viewBox="0 0 120 80" className="mx-auto w-32" aria-hidden><g fill="#f4f1e6" stroke="#0e1a17" strokeWidth="3" strokeLinejoin="round" style={{ transformOrigin: "60px 40px", animation: "fold 2.4s ease-in-out infinite alternate" }}><path d="M10 10 H110 V70 H10 Z" /><path d="M10 40 H110" fill="none" /></g><style>{`@keyframes fold{from{transform:perspective(300px) rotateX(0)}to{transform:perspective(300px) rotateX(35deg) scale(.92)}}`}</style></svg>
          {planId ? (
            <><p className="hand mt-2 text-2xl">Your plan is ready. Please take a look.</p><Link href={`/app/plans/${planId}`} className="btn btn-sun mt-3">View plan</Link></>
          ) : (
            <><p className="hand mt-2 text-2xl">We are building your plan.</p><p className="mt-2 font-semibold">A person is reviewing it. Your plan will arrive within 15 minutes.</p>{slaDueAt && <p className="mono mt-1 text-sm">SLA: <Countdown to={slaDueAt} prefix="" /></p>}{needsHuman && <p className="mt-1 text-xs opacity-70">We are giving this request extra attention.</p>}<Link href="/app" className="btn btn-ghost btn-sm mt-3">Home</Link></>
          )}
        </div>
      )}
    </div>
  );
}
