"use client";

import Link from "next/link";
import { ArrowLeft, Users, PackageCheck, IndianRupee, AlertTriangle } from "lucide-react";

const DEMO_ORDERS = [
  { id: "SHL-482910", customer: "Ananya S. · Tower B", service: "Bathroom Deep Cleaning", helper: "Isha Kapoor", status: "en_route", total: 499 },
  { id: "SHL-482911", customer: "Rohan M. · Tower A", service: "Groceries + Parcel", helper: "Amit Verma", status: "in_progress", total: 342 },
  { id: "SHL-482912", customer: "Priya K. · Tower D", service: "Small Repairs", helper: "Unassigned", status: "confirmed", total: 249 },
];

export default function AdminConsolePage() {
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
            <h1 className="text-base font-bold text-[#0E1A17]">Shell Ops &amp; Admin Console</h1>
          </div>
          <span className="rounded-[6px] bg-[#EEF6F0] px-2.5 py-1 text-xs font-semibold text-[#0B2B26]">
            Dwarka Sector 12
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 md:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Today's orders", value: "24", icon: PackageCheck },
            { label: "Unassigned jobs", value: "1", icon: AlertTriangle },
            { label: "Helpers online", value: "12", icon: Users },
            { label: "Revenue today", value: "Rs 14,820", icon: IndianRupee },
          ].map((m) => {
            const IconComp = m.icon;
            return (
              <div key={m.label} className="rounded-[12px] border border-[#E3E8E4] bg-white p-4">
                <div className="flex items-center justify-between text-xs text-[#4B5A55]">
                  <span>{m.label}</span>
                  <IconComp className="h-4 w-4 text-[#0B2B26]" strokeWidth={1.75} />
                </div>
                <div className="mt-2 text-2xl font-bold text-[#0E1A17]">{m.value}</div>
              </div>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-[12px] border border-[#E3E8E4] bg-white">
          <div className="border-b border-[#E3E8E4] px-5 py-3.5 text-sm font-bold text-[#0E1A17]">
            Live Orders Queue
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8F6] text-[#4B5A55]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order ID</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Helper</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8E4]">
                {DEMO_ORDERS.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-[#0B2B26]">{o.id}</td>
                    <td className="px-4 py-3">{o.customer}</td>
                    <td className="px-4 py-3">{o.service}</td>
                    <td className="px-4 py-3">{o.helper}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-[6px] bg-[#EEF6F0] px-2 py-0.5 font-semibold text-[#0B2B26]">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">Rs {o.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
