"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (status !== "RECEIVED") return null;
  const onCancel = async () => {
    if (!confirm("Cancel this booking? You can cancel only when RECEIVED.")) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(`/api/bookings/${id}`, { method: "PATCH" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Cancel failed");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <button type="button" disabled={busy} onClick={onCancel} className="inline-flex min-h-[40px] items-center rounded-[10px] border border-[#C2362B] bg-white px-4 text-xs font-semibold text-[#C2362B] hover:bg-[#C2362B]/10 disabled:opacity-60">
        {busy ? "Cancelling..." : "Cancel booking"}
      </button>
      {err && <p className="mt-1 text-xs text-[#C2362B]">{err}</p>}
    </div>
  );
}
