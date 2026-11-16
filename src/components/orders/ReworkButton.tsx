"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReworkButton({ id, status, updatedAt }: { id: string; status: string; updatedAt: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (status !== "COMPLETED") return null;
  const elapsed = Date.now() - new Date(updatedAt).getTime();
  const within24h = elapsed < 24 * 3600 * 1000;
  if (!within24h) return <p className="text-xs text-[#7C8A85]">24h rework window has passed.</p>;
  const hoursLeft = Math.max(0, Math.ceil((24 * 3600 * 1000 - elapsed) / 3600000));
  const call = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/bookings/${id}/rework`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: "Request rework within 24h" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setMsg(j.message ?? "Rework requested.");
      router.refresh();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-[12px] border border-[#E3E8E4] bg-[#EEF6F0] p-4">
      <div className="text-xs font-bold text-[#0B2B26]">24h free rework</div>
      <p className="mt-1 text-xs text-[#4B5A55]">If it’s not right, we send someone back at no cost within 24 hours. {hoursLeft}h left.</p>
      <button disabled={busy} onClick={call} className="mt-3 min-h-[40px] rounded-[10px] bg-[#0B2B26] px-4 text-xs font-semibold text-white disabled:opacity-60">{busy ? "…" : "Request rework"}</button>
      {msg && <p className="mt-2 text-xs font-semibold text-[#0B2B26]">{msg}</p>}
    </div>
  );
}
