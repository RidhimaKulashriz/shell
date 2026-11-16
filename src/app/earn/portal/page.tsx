import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, helpers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { StatusChip } from "@/components/orders/StatusChip";

export const metadata = { title: "Helper Jobs" };

export default async function Page() {
  const user = await requireUser(["HELPER"], "/earn/login");
  const [h] = await db.select().from(helpers).where(eq(helpers.userId, user.id)).limit(1);
  if (!h) return <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-6 text-sm">Helper profile not found. Complete /earn/apply first.</div>;
  const rows = await db.select().from(bookings).where(eq(bookings.helperId, h.id)).orderBy(desc(bookings.slotStart)).limit(50);
  const stats = { assigned: rows.filter((r) => r.status === "ASSIGNED").length, inProgress: rows.filter((r) => r.status === "IN_PROGRESS").length, done: rows.filter((r) => r.status === "COMPLETED").length };

  return (
    <div className="space-y-4">
      <div className="rounded-[12px] bg-[#0B2B26] p-4 text-white">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#8EB69B]">Helper portal · OTP login</div>
        <h1 className="mt-1 text-xl font-bold">Your jobs — Dwarka 6/10/12</h1>
        <p className="mt-1 text-xs text-white/70">Tap a job to go On the way, Start with 4-digit door OTP (5 tries), then Complete.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-3"><div className="text-lg font-bold text-[#0B2B26]">{stats.assigned}</div><div className="text-xs text-[#4B5A55]">Assigned</div></div>
        <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-3"><div className="text-lg font-bold text-[#1E8E5A]">{stats.inProgress}</div><div className="text-xs text-[#4B5A55]">In progress</div></div>
        <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-3"><div className="text-lg font-bold text-[#0E1A17]">{stats.done}</div><div className="text-xs text-[#4B5A55]">Completed</div></div>
      </div>

      {rows.length === 0 && <div className="rounded-[12px] border border-dashed border-[#E3E8E4] bg-white p-10 text-center"><p className="text-sm font-semibold text-[#0E1A17]">No jobs assigned yet.</p><p className="mt-1 text-xs text-[#4B5A55]">Ops will assign you when a booking is in your sector and slot. Keep OTP login ready.</p></div>}

      <div className="grid gap-3">
        {rows.map((r) => (
          <Link key={r.id} href={`/earn/portal/jobs/${r.id}`} className="rounded-[12px] border border-[#E3E8E4] bg-white p-4 hover:border-[#0B2B26]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-[#0E1A17]">{r.serviceName} ×{r.quantity}</div>
                <div className="mt-1 text-xs text-[#4B5A55]">{new Date(r.slotStart).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", hour: "numeric", minute: "2-digit" })} — {new Date(r.slotEnd).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" })} · IST</div>
                <div className="mt-1 text-xs text-[#4B5A55]">{r.address}</div>
                <div className="mt-1 text-xs font-semibold text-[#0E1A17]">Rs {r.total}</div>
              </div>
              <StatusChip status={r.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
