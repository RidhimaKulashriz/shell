"use client";
import { useState } from "react";
import { Bell, CheckCircle2, Sparkles, Utensils, ShoppingBasket, Package, FolderKanban, PartyPopper, Users, FileSpreadsheet, BookOpen, Dog, Truck, Wrench, Clock, Trophy } from "lucide-react";

type Svc = { id: string; slug: string; name: string; price: number; unit: string; description: string; inclusions: string[]; iconName: string };

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Sparkles, Utensils, ShoppingBasket, Package, FolderKanban, PartyPopper, Users, FileSpreadsheet, BookOpen, Dog, Truck, Wrench, Clock, Trophy,
};
function RenderIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const C = ICON_MAP[name] ?? Sparkles;
  return <C className={className} strokeWidth={1.75} />;
}

function NotifyButton({ slug }: { slug: string }) {
  const [phone, setPhone] = useState("");
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setErr("");
    const d = phone.replace(/\D/g, "");
    if (d.length !== 10) { setErr("Enter 10-digit number."); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: d, serviceSlug: slug }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setSent(true);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  if (sent) return <span className="text-xs font-semibold text-[#1E8E5A]">We will notify you.</span>;
  return (
    <div className="mt-3">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[10px] border border-[#0B2B26] bg-white px-4 text-xs font-semibold text-[#0B2B26] hover:bg-[#EEF6F0]">
          <Bell className="h-3.5 w-3.5" /> Notify me when available
        </button>
      ) : (
        <div className="flex gap-2">
          <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" className="min-h-[40px] flex-1 rounded-[10px] border border-[#E3E8E4] px-3 text-sm" />
          <button type="button" disabled={busy} onClick={submit} className="min-h-[40px] rounded-[10px] bg-[#0B2B26] px-4 text-xs font-semibold text-white disabled:opacity-60">{busy ? "..." : "Notify"}</button>
        </div>
      )}
      {err && <p className="mt-1 text-xs text-[#C2362B]">{err}</p>}
    </div>
  );
}

export function ServiceGrid({ bookable, comingSoon }: { bookable: Svc[]; comingSoon: Svc[] }) {
  return (
    <>
      <section className="mx-auto max-w-[1200px] px-4 md:px-6">
        <h2 className="text-lg font-bold text-[#0E1A17]">Bookable now — 4 services</h2>
        <p className="mt-1 text-xs text-[#4B5A55]">Scheduled 2-hour slots · 8am–8pm · 7 days · Dwarka Sectors 6, 10, 12</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bookable.map((s) => (
            <div key={s.id} className="flex flex-col justify-between rounded-[12px] border border-[#E3E8E4] bg-white p-4 hover:border-[#0B2B26]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#EEF6F0] text-[#0B2B26]"><RenderIcon name={s.iconName} /></div>
                  <span className="rounded-[6px] bg-[#0B2B26] px-2 py-0.5 text-[11px] font-semibold text-white">Bookable</span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-[#0E1A17]">{s.name}</h3>
                <p className="mt-1 text-xs text-[#4B5A55]">{s.description}</p>
                <div className="mt-2 text-[11px] font-medium text-[#4B5A55]">{s.unit}</div>
                <ul className="mt-2 space-y-1 text-xs text-[#4B5A55]">{s.inclusions.map((i) => <li key={i} className="flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-[#1E8E5A]" strokeWidth={1.75} />{i}</li>)}</ul>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#E3E8E4] pt-3">
                <span className="text-sm font-bold text-[#0E1A17]">Rs {s.price}</span>
                <a href="/#catalog" className="min-h-[40px] rounded-[10px] border border-[#0B2B26] bg-[#EEF6F0] px-4 py-2 text-xs font-semibold text-[#0B2B26] hover:bg-[#0B2B26] hover:text-white">Book</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-10 md:px-6">
        <h2 className="text-lg font-bold text-[#0E1A17]">Coming soon</h2>
        <p className="mt-1 text-xs text-[#4B5A55]">We will open these after the pilot. Tap Notify and we will text you.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoon.map((s) => (
            <div key={s.id} className="rounded-[12px] border border-dashed border-[#E3E8E4] bg-[#F7F8F6]/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-white text-[#0B2B26]"><RenderIcon name={s.iconName} /></div>
                <span className="rounded-[6px] bg-[#E3E8E4] px-2 py-0.5 text-[11px] font-semibold text-[#4B5A55]">Coming soon</span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-[#0E1A17]">{s.name}</h3>
              <p className="mt-1 text-xs text-[#4B5A55]">{s.description}</p>
              <div className="mt-2 text-[11px] font-medium text-[#4B5A55]">{s.unit}</div>
              <NotifyButton slug={s.slug} />
              <div className="mt-3 text-sm font-bold text-[#0E1A17]">Rs {s.price}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
