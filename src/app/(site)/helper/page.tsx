"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Power, CheckCircle2, MapPin, KeyRound, Wallet, ShieldAlert } from "lucide-react";

export default function HelperPortalPage() {
  const [online, setOnline] = useState(true);
  const [offerAccepted, setOfferAccepted] = useState(false);
  const [doorOtp, setDoorOtp] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#0E1A17]">
      <header className="border-b border-[#E3E8E4] bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border border-[#E3E8E4] px-3 text-xs font-semibold text-[#0E1A17]"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
              Storefront
            </Link>
            <h1 className="text-base font-bold text-[#0E1A17]">Shell Helper Portal</h1>
          </div>

          <button
            type="button"
            onClick={() => setOnline(!online)}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-[10px] px-4 text-xs font-semibold text-white ${
              online ? "bg-[#1E8E5A]" : "bg-[#7C8A85]"
            }`}
          >
            <Power className="h-4 w-4" strokeWidth={1.75} />
            {online ? "Online · Accepting jobs" : "Offline"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-6 md:grid-cols-3 md:px-6">
        <div className="space-y-4 md:col-span-2">
          {/* Incoming Job Offer */}
          <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-[6px] bg-[#EEF6F0] px-2.5 py-1 text-xs font-semibold text-[#0B2B26]">
                {offerAccepted ? "Active Job" : "New Job Offer · 90s"}
              </span>
              <span className="text-base font-bold text-[#0E1A17]">Rs 499</span>
            </div>

            <h2 className="mt-3 text-lg font-bold text-[#0E1A17]">
              Bathroom Deep Cleaning (45 mins)
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[#4B5A55]">
              <MapPin className="h-4 w-4 text-[#0B2B26]" strokeWidth={1.75} />
              Tower B, Flat 402, Metro View Apartments · Gate 1 · 350m away
            </p>

            {!offerAccepted ? (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setOfferAccepted(true)}
                  className="min-h-[44px] flex-1 rounded-[10px] bg-[#0B2B26] text-xs font-semibold text-white hover:bg-[#163832]"
                >
                  Accept job
                </button>
                <button
                  type="button"
                  className="min-h-[44px] rounded-[10px] border border-[#E3E8E4] px-4 text-xs font-semibold text-[#4B5A55]"
                >
                  Decline
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3 border-t border-[#E3E8E4] pt-4">
                {!checkedIn ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8A85]" />
                      <input
                        type="text"
                        value={doorOtp}
                        onChange={(e) => setDoorOtp(e.target.value)}
                        placeholder="Enter 4-digit Door OTP"
                        className="min-h-[44px] w-full rounded-[10px] border border-[#E3E8E4] pl-9 pr-3 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckedIn(true)}
                      className="min-h-[44px] rounded-[10px] bg-[#0B2B26] px-4 text-xs font-semibold text-white"
                    >
                      Check in
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-[10px] bg-[#EEF6F0] p-3 text-xs font-semibold text-[#1E8E5A]">
                    <CheckCircle2 className="h-4 w-4" />
                    Checked in. Job in progress.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Earnings & Safety */}
        <aside className="space-y-4">
          <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0E1A17]">
              <Wallet className="h-4 w-4 text-[#0B2B26]" strokeWidth={1.75} />
              <span>Today&apos;s Earnings</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-[#0B2B26]">Rs 1,240</div>
            <p className="mt-1 text-xs text-[#4B5A55]">3 jobs completed · 4.94 rating</p>
          </div>

          <div className="rounded-[12px] border border-[#C2362B]/30 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#C2362B]">
              <ShieldAlert className="h-4 w-4" strokeWidth={1.75} />
              <span>Safety &amp; SOS</span>
            </div>
            <p className="mt-1 text-xs text-[#4B5A55]">
              Hold for 2 seconds to alert Shell Ops &amp; society security.
            </p>
            <button
              type="button"
              className="mt-3 min-h-[44px] w-full rounded-[10px] bg-[#C2362B] text-xs font-semibold text-white"
            >
              Hold for SOS
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
