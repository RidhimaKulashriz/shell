"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function HelperActions({ booking }: { booking: { id: string; status: string; otpFailures: number } }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const remaining = 5 - booking.otpFailures;

  const call = async (url: string, body?: unknown) => {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? j.remaining ? `Wrong OTP. ${j.remaining} tries left.` : "Failed");
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
      {booking.status === "ASSIGNED" && (
        <button disabled={busy} onClick={() => call(`/api/earn/bookings/${booking.id}/on-the-way`)} className="min-h-[44px] w-full rounded-[10px] bg-[#0B2B26] text-sm font-semibold text-white hover:bg-[#163832] disabled:opacity-60">On the way</button>
      )}

      {booking.status === "ASSIGNED" && (
        <div className="rounded-[12px] border border-[#E3E8E4] bg-[#F7F8F6] p-4">
          <div className="text-xs font-semibold text-[#0E1A17]">Start job — enter 4-digit door OTP from customer</div>
          <div className="mt-2 flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="4-digit OTP" inputMode="numeric" className="min-h-[44px] flex-1 rounded-[10px] border border-[#E3E8E4] bg-white px-3 text-center font-mono text-lg tracking-widest" />
            <button disabled={code.length !== 4 || busy} onClick={() => call(`/api/bookings/${booking.id}/otp`, { code })} className="min-h-[44px] rounded-[10px] bg-[#1E8E5A] px-5 text-sm font-semibold text-white disabled:opacity-60">Start with OTP</button>
          </div>
          <p className="mt-2 text-xs text-[#4B5A55]">5 tries max. {remaining} tries left. After 5, contact ops. OTP verified server-side via sha hash.</p>
        </div>
      )}

      {booking.status === "IN_PROGRESS" && (
        <button disabled={busy} onClick={() => call(`/api/earn/bookings/${booking.id}/complete`)} className="min-h-[44px] w-full rounded-[10px] bg-[#0B2B26] text-sm font-semibold text-white hover:bg-[#163832] disabled:opacity-60">Complete job</button>
      )}

      {msg && <p className="text-xs font-semibold text-[#0B2B26]">{msg}</p>}
      <p className="text-[11px] text-[#7C8A85]">OTP login at /earn/login (HELPER) → on the way → start with door OTP (4-digit, 5 tries) → complete. All transitions audit-logged.</p>
    </div>
  );
}
