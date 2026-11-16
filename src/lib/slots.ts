// 2-hour slots 8am-8pm, 7 days, max 3 per slot
export const SLOT_HOURS: [number, number][] = [
  [8, 10],
  [10, 12],
  [12, 14],
  [14, 16],
  [16, 18],
  [18, 20],
];

export const MAX_PER_SLOT = 3;

export interface Slot {
  start: Date;
  end: Date;
  label: string; // e.g. "Today, 8:00 AM - 10:00 AM"
  iso: string; // start ISO for API
  disabled?: boolean;
}

function formatSlot(d: Date, startH: number, endH: number): string {
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const fmt = (h: number) => {
    const ampm = h < 12 ? "AM" : "PM";
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:00 ${ampm}`;
  };
  return `${dayLabel}, ${fmt(startH)} - ${fmt(endH)}`;
}

export function generateSlots(days = 7): Slot[] {
  const slots: Slot[] = [];
  const now = new Date();
  // Round to start of today in IST (we use local time; server in IST)
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);
    date.setHours(0, 0, 0, 0);
    for (const [sh, eh] of SLOT_HOURS) {
      const start = new Date(date);
      start.setHours(sh, 0, 0, 0);
      const end = new Date(date);
      end.setHours(eh, 0, 0, 0);
      // skip past slots
      if (end <= now) continue;
      slots.push({ start, end, label: formatSlot(date, sh, eh), iso: start.toISOString() });
    }
  }
  return slots;
}

export function slotKey(date: Date): string {
  // key = YYYY-MM-DD-HH
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  return `${y}-${m}-${d}-${h}`;
}
