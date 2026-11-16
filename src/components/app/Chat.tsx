"use client";
import { useEffect, useRef, useState } from "react";
import { send } from "@/lib/offline";

type Msg = { id: string; senderRole: string; body: string; translatedBody: string | null; blurred: boolean; createdAt: string };

/** In-app chat only. Phone numbers, UPI IDs and handles are blurred with a gentle warning. */
export function Chat({ threadKey, me = "CUSTOMER", title = "Chat" }: { threadKey: string; me?: string; title?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [warn, setWarn] = useState("");
  const [tr, setTr] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const load = async () => { const r = await fetch(`/api/threads/${encodeURIComponent(threadKey)}/messages`); if (r.ok) setMsgs((await r.json()).messages); };
  useEffect(() => { load(); const t = setInterval(load, 6000); return () => clearInterval(t); }, [threadKey]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text; setText("");
    const r = await send(`/api/threads/${encodeURIComponent(threadKey)}/messages`, { body });
    if (r.data?.warning) setWarn(r.data.warning);
    await load();
  };
  return (
    <section aria-label={title} className="rounded-2xl border border-ink/20 bg-paper">
      <div className="flex items-center justify-between border-b border-dashed border-ink/30 px-3 py-2"><b className="display text-lg">{title}</b><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={tr} onChange={(e) => setTr(e.target.checked)} /> Translate</label></div>
      <div className="max-h-72 space-y-2 overflow-y-auto p-3" aria-live="polite">
        {msgs.length === 0 && <p className="hand text-center text-xl opacity-60">Nothing here yet.</p>}
        {msgs.map((m) => { const mine = m.senderRole === me; return <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? "ml-auto rounded-br-sm bg-forest text-cream" : "rounded-bl-sm bg-cream"}`}><span className="mono block text-[10px] uppercase opacity-60">{m.senderRole === "OPS" ? "Shell" : m.senderRole.toLowerCase()}</span><span className={m.blurred ? "blur-leak" : ""} title={m.blurred ? "Hidden: contact details are not allowed in chat" : undefined}>{tr && m.translatedBody ? m.translatedBody : m.body}</span></div>; })}
        <div ref={end} />
      </div>
      {warn && <p role="alert" className="mx-3 rounded-xl bg-sand p-2 text-xs font-semibold">{warn}</p>}
      <form onSubmit={submit} className="flex gap-2 p-3"><input className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" aria-label="Message" maxLength={1000} /><button className="btn btn-forest btn-sm">Bhejo</button></form>
    </section>
  );
}
