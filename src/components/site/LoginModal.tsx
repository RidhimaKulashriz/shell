"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Phone, ShieldCheck } from "lucide-react";

type Props = { open: boolean; onClose: () => void };

export function LoginModal({ open, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [role] = useState<"CUSTOMER" | "HELPER">("CUSTOMER");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [timer, setTimer] = useState(0);

  // 30s resend countdown
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setErr("");
      setBusy(false);
    } else {
      // delay reset to avoid flash
      const id = setTimeout(() => {
        setStep("phone");
        setPhone("");
        setCode("");
        setErr("");
        setTimer(0);
      }, 200);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const post = async (url: string, body: unknown) => {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error?.message ?? j.message ?? "Something went wrong. Please try again.");
    return j;
  };

  const send = async () => {
    setErr("");
    if (phone.length !== 10) {
      setErr("Enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      await post("/api/auth/request", { phone, role });
      setStep("otp");
      setTimer(30);
      setCode("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setErr("");
    if (code.length !== 6) {
      setErr("Enter the 6-digit OTP.");
      return;
    }
    setBusy(true);
    try {
      const j = await post("/api/auth/verify", { phone, code, role });
      // j.redirect is role-based: /app, /earn/portal, /ops, /society
      const dest: string = j.redirect ?? "/app";
      onClose();
      router.push(dest);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Login"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-[16px] border border-[#E3E8E4] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E3E8E4] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#0B2B26] text-sm font-bold text-[#F2C318]">
              S
            </span>
            <h2 className="text-base font-bold text-[#0E1A17]">Login to Shell</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close login"
            className="rounded-[10px] p-1.5 text-[#4B5A55] hover:bg-[#F7F8F6]"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5">
          {step === "phone" && (
            <div className="space-y-4">
              <p className="text-sm text-[#4B5A55]">
                Enter your mobile number. We&apos;ll send a 6-digit OTP on WhatsApp (SMS fallback).
              </p>

              <div>
                <label htmlFor="login-phone" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1A17]">
                  Mobile number
                </label>
                <div className="mt-1.5 flex gap-2">
                  <span className="inline-flex min-h-[44px] items-center rounded-[10px] border border-[#E3E8E4] bg-[#F7F8F6] px-3 text-sm font-semibold text-[#0E1A17]">
                    +91
                  </span>
                  <input
                    id="login-phone"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="98765 43210"
                    className="min-h-[44px] flex-1 rounded-[10px] border border-[#E3E8E4] bg-white px-3 text-sm font-medium text-[#0E1A17] placeholder:text-[#7C8A85] focus:border-[#0B2B26] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={phone.length !== 10 || busy}
                onClick={send}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#0B2B26] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163832] disabled:opacity-50"
              >
                <Phone className="h-4 w-4 text-[#F2C318]" strokeWidth={1.75} />
                {busy ? "Sending..." : "Send OTP"}
              </button>

              <p className="text-center text-xs text-[#7C8A85]">OTP expires in 5 minutes · 3 tries then 10-min lock</p>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <p className="text-sm text-[#4B5A55]">
                Enter the 6-digit OTP sent to <span className="font-semibold text-[#0E1A17]">+91 {phone}</span>
              </p>

              <div>
                <label htmlFor="login-otp" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1A17]">
                  6-digit OTP
                </label>
                <input
                  id="login-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  onPaste={(e) => {
                    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                    if (t) {
                      e.preventDefault();
                      setCode(t);
                    }
                  }}
                  placeholder="123456"
                  className="mt-1.5 min-h-[44px] w-full rounded-[10px] border border-[#E3E8E4] bg-white px-3 text-center font-mono text-lg tracking-[0.3em] text-[#0E1A17] placeholder:text-[#7C8A85] focus:border-[#0B2B26] focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={code.length !== 6 || busy}
                onClick={verify}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#0B2B26] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163832] disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4 text-[#F2C318]" strokeWidth={1.75} />
                {busy ? "Verifying..." : "Verify & continue"}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-xs font-semibold text-[#4B5A55] hover:text-[#0B2B26] hover:underline"
                >
                  Change number
                </button>

                <button
                  type="button"
                  disabled={timer > 0 || busy}
                  onClick={send}
                  className="text-xs font-semibold text-[#0B2B26] hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          {err && (
            <p role="alert" className="mt-4 rounded-[10px] bg-[#C2362B]/10 px-3 py-2.5 text-sm font-semibold text-[#C2362B]">
              {err}
            </p>
          )}
        </div>

        <div className="rounded-b-[16px] border-t border-[#E3E8E4] bg-[#F7F8F6] px-5 py-3 text-center text-xs text-[#7C8A85]">
          By continuing, you agree to our Terms and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
