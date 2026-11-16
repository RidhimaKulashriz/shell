import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { generateSlots, slotKey, MAX_PER_SLOT } from "@/lib/slots";

export async function GET() {
  const slots = generateSlots(7);
  // fetch counts per slot
  const counts = new Map<string, number>();
  try {
    // naive: query each slot; small N (42)
    for (const s of slots) {
      const key = slotKey(s.start);
      const [{ n }] = await db.select({ n: count() }).from(bookings).where(eq(bookings.slotKey, key));
      counts.set(key, n);
    }
  } catch {
    // if DB unavailable, return slots as all available
  }
  const data = slots.map((s) => {
    const key = slotKey(s.start);
    const booked = counts.get(key) ?? 0;
    const remaining = Math.max(0, MAX_PER_SLOT - booked);
    return { label: s.label, iso: s.iso, start: s.start.toISOString(), end: s.end.toISOString(), booked, remaining, full: booked >= MAX_PER_SLOT };
  });
  return NextResponse.json({ slots: data, maxPerSlot: MAX_PER_SLOT });
}
