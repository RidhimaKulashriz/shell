"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/components/ui";

const FLOW = ["Gate pass guard ko gaya", "Helper ka dot chal pada", "Door OTP mila", "Check-in", "Kaam shuru", "Check-out"];

export function GuardianPath() {
  const [ref, seen] = useInView<HTMLDivElement>(0.35);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(FLOW.length - 1);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setStep(Math.min(i, FLOW.length - 1));
      if (i >= FLOW.length - 1) clearInterval(id);
    }, 1100);
    return () => clearInterval(id);
  }, [seen]);
  const pos = [[40, 190], [120, 150], [210, 110], [290, 70], [330, 50], [330, 50]][step];
  return (
    <div ref={ref} className="rounded-[28px_36px_24px_32px] bg-moss p-4 ring-2 ring-sage/40 md:p-6">
      <svg viewBox="0 0 380 240" className="w-full" role="img" aria-label="Path from Gate to Tower to Door with six safety steps">
        <path id="gpath" d="M40 190 C90 170 110 140 150 135 S250 100 290 70 S330 55 330 50" fill="none" stroke="#8EB69B" strokeWidth="3" strokeDasharray="3 8" strokeLinecap="round" />
        {[["Gate", 40, 190, "bag"], ["Tower", 290, 70, "tower"], ["Door", 335, 50, "door"]].map(([l, x, y]) => (
          <g key={l as string}>
            <circle cx={x as number} cy={y as number} r="13" fill="#235347" stroke="#DAF1DE" strokeWidth="2" />
            <text x={(x as number)} y={(y as number) + 30} textAnchor="middle" fill="#DAF1DE" fontFamily="Caveat, cursive" fontSize="19" fontWeight="700">{l as string}</text>
          </g>
        ))}
        <g style={{ transform: `translate(${pos[0]}px, ${pos[1]}px)`, transition: "transform 1s cubic-bezier(.6,0,.2,1)" }}>
          <circle r="4" fill="none" stroke="#F2C318" className="pulse-ring" />
          <circle r="7" fill="#F2C318" stroke="#051F20" strokeWidth="2.5" />
        </g>
        {step >= 2 ? <text x="215" y="48" fill="#F2C318" fontFamily="DM Mono, monospace" fontSize="15" className="slidein">OTP 4821</text> : null}
      </svg>
      <ol className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        {FLOW.map((f, i) => (
          <li key={f} className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${i <= step ? "bg-sage text-tide" : "bg-forest text-cream/60"}`}>
            <span className="font-mono text-xs">{i + 1}</span>{f}
          </li>
        ))}
      </ol>
    </div>
  );
}

const PROMISES = [
  ["Verified ID", "Government ID through a KYC provider. We never keep the Aadhaar number."],
  ["College ID checked", "Both sides, with expiry. Most helpers are students you can look up."],
  ["Door OTP", "The job cannot start without the code only you can give."],
  ["Gate pass to the guard", "The guard gets a QR and sees who is coming, to which tower."],
  ["Live SOS", "Press and hold, or shake. Ops hears in 20 seconds, so does your guard."],
  ["Payment held", "Your money waits with us until you approve the work."],
];

export function Promises() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {PROMISES.map(([t, d], i) => (
        <li key={t} className="relative rounded-2xl border-2 border-dashed border-sage/50 p-4 pl-14" style={{ transform: `rotate(${[-0.8, 0.6, 0.4, -0.5, 0.7, -0.4][i]}deg)` }}>
          <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-sand font-mono text-sm text-sand" style={{ transform: "rotate(-6deg)" }}>{i + 1}</span>
          <p className="font-display text-xl font-bold">{t}</p>
          <p className="mt-0.5 text-[0.93rem] text-cream/80">{d}</p>
        </li>
      ))}
    </ol>
  );
}
