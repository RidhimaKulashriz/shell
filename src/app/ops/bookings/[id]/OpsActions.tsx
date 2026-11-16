"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function OpsActions({ booking, helpers }: { booking: { id: string; status: string; helperId: string | null; paymentStatus: string }; helpers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [helperId, setHelperId] = useState(booking.helperId ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const call = async (url: string, body: unknown) => {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setMsg("Done.");
      router.refresh();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {booking.status === "RECEIVED" && (
        <div className="rounded-[10px] border border-[#E3E8E4] bg-white p-3">
          <div className="text-xs font-semibold text-[#0E1A17]">Assign helper</div>
          <div className="mt-2 flex gap-2">
            <select value={helperId} onChange={(e) => setHelperId(e.target.value)} className="min-h-[40px] flex-1 rounded-[10px] border border-[#E3E8E4] bg-white px-3 text-sm">
              <option value="">Select helper</option>
              {helpers.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <button disabled={!helperId || busy} onClick={() => call(`/api/ops/bookings/${booking.id}/assign`, { helperId })} className="min-h-[40px] rounded-[10px] bg-[#0B2B26] px-4 text-xs font-semibold text-white disabled:opacity-60">Assign → ASSIGNED</button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {booking.status === "ASSIGNED" && <button disabled={busy} onClick={() => call(`/api/ops/bookings/${booking.id}/status`, { to: "IN_PROGRESS" })} className="min-h-[40px] rounded-[10px] bg-[#1E8E5A] px-4 text-xs font-semibold text-white disabled:opacity-60">Start → IN_PROGRESS</button>}
        {booking.status === "IN_PROGRESS" && <button disabled={busy} onClick={() => call(`/api/ops/bookings/${booking.id}/status`, { to: "COMPLETED" })} className="min-h-[40px] rounded-[10px] bg-[#0B2B26] px-4 text-xs font-semibold text-white disabled:opacity-60">Complete → COMPLETED</button>}
        {(booking.status === "RECEIVED" || booking.status === "ASSIGNED") && <button disabled={busy} onClick={() => call(`/api/ops/bookings/${booking.id}/status`, { to: "CANCELLED" })} className="min-h-[40px] rounded-[10px] border border-[#C2362B] bg-white px-4 text-xs font-semibold text-[#C2362B] disabled:opacity-60">Cancel</button>}
        {booking.paymentStatus !== "PAID" && <button disabled={busy} onClick={() => call(`/api/ops/bookings/${booking.id}/mark-paid`, {})} className="min-h-[40px] rounded-[10px] border border-[#0B2B26] bg-white px-4 text-xs font-semibold text-[#0B2B26] disabled:opacity-60">Mark paid (UPI/cash)</button>}
      </div>
      {msg && <p className="text-xs font-semibold text-[#0B2B26]">{msg}</p>}
      <p className="text-[11px] text-[#7C8A85]">Transitions: RECEIVED→ASSIGNED→IN_PROGRESS→COMPLETED (or CANCELLED from RECEIVED/ASSIGNED). All actions audit-logged.</p>
    </div>
  );
}
