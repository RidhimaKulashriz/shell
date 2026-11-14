"use client";
import { useRef, useState } from "react";
import { Stamp } from "@/components/ui";
import { track } from "@/lib/analytics";

export type Field = { name: string; label: string; type?: "text" | "email" | "tel" | "number" | "textarea" | "select"; options?: string[]; required?: boolean };

/** Generic enquiry / contact form posting to /api/contact. Used for societies, hostels and offices, contact and "notify me". */
export function EnquiryForm({ kind, fields, cta = "Send", success = "Received. We will be in touch shortly.", presets = {} }: { kind: string; fields: Field[]; cta?: string; success?: string; presets?: Record<string, string> }) {
  const [v, setV] = useState<Record<string, string>>(presets);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const started = useRef(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    const { name, phone, email, message, ...rest } = v;
    const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, name, phone, email, message, data: rest }) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(j.error?.message ?? "Something went wrong. Please try again."); track("form_error", { form: kind }); return; }
    setDone(true); track("form_submit", { form: kind });
  };
  if (done) return <div className="receipt scallop-b text-center"><Stamp label="Received" tone="ink" large /><p className="display mt-4 text-2xl">{success}</p></div>;
  return (
    <form onSubmit={submit} className="receipt scallop-b space-y-3 !text-[14px]">
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`${kind}-${f.name}`} className="mono mb-1 block text-xs uppercase tracking-wider opacity-70">{f.label}{f.required && " *"}</label>
          {f.type === "textarea" ? <textarea id={`${kind}-${f.name}`} className="field min-h-[90px]" required={f.required} value={v[f.name] ?? ""} onChange={(e) => { if (!started.current) { started.current = true; track("form_start", { form: kind }); } setV({ ...v, [f.name]: e.target.value }); }} />
            : f.type === "select" ? <select id={`${kind}-${f.name}`} className="field" required={f.required} value={v[f.name] ?? ""} onChange={(e) => setV({ ...v, [f.name]: e.target.value })}><option value="">Choose</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
            : <input id={`${kind}-${f.name}`} className="field" type={f.type ?? "text"} required={f.required} value={v[f.name] ?? ""} onChange={(e) => { if (!started.current) { started.current = true; track("form_start", { form: kind }); } setV({ ...v, [f.name]: e.target.value }); }} />}
        </div>
      ))}
      {err && <p role="alert" className="text-sm font-semibold text-brick">{err}</p>}
      <button className="btn btn-sun w-full" disabled={busy}>{busy ? "Sending..." : cta}</button>
    </form>
  );
}
