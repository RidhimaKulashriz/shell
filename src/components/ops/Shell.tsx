"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV: [string, string][] = [
  ["/ops", "Today"],
  ["/ops/bookings", "Bookings"],
  ["/ops/requests", "Requests"],
  ["/ops/dispatch", "Dispatch"],
  ["/ops/jobs", "Jobs"],
  ["/ops/helpers", "Helpers"],
  ["/ops/customers", "Customers"],
  ["/ops/disputes", "Disputes"],
  ["/ops/safety", "Safety / SOS"],
  ["/ops/fraud", "Leakage & fraud"],
  ["/ops/finance", "Finance"],
  ["/ops/pricing", "Pricing engine"],
  ["/ops/catalog", "Catalog"],
  ["/ops/societies", "Societies & zones"],
  ["/ops/analytics", "Analytics"],
  ["/ops/content", "Content & templates"],
  ["/ops/settings", "Settings & audit"],
];

export function OpsShell({ children, name, role }: { children: ReactNode; name: string; role: string }) {
  const path = usePathname();
  return (
    <div className="flex min-h-screen bg-[#F7F8F6] text-[#0E1A17]">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#E3E8E4] bg-[#0B2B26] p-3 text-white md:flex">
        <Link href="/ops" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-sm font-bold text-[#0B2B26]">S</span> Shell Ops
        </Link>
        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto">
          {NAV.map(([h, l]) => {
            const on = h === "/ops" ? path === "/ops" : path.startsWith(h);
            return (
              <Link key={h} href={h} className={`block rounded-[10px] px-3 py-1.5 text-sm ${on ? "bg-white text-[#0B2B26]" : "hover:bg-white/10"}`}>{l}</Link>
            );
          })}
        </nav>
        <p className="text-xs text-white/60">{name} · {role}</p>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#E3E8E4] bg-white px-4 py-2">
          <span className="rounded-[6px] bg-[#EEF6F0] px-2 py-0.5 text-xs font-semibold text-[#0B2B26]">Dwarka Pilot · 6/10/12</span>
          <span className="ml-auto text-xs text-[#7C8A85]">Ops • {role}</span>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
