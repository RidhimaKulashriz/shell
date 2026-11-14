export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const IST = "Asia/Kolkata";
export const fmtDateTime = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-IN", { timeZone: IST, day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }) : "—";
export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric" }) : "—";
export const fmtTime = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleTimeString("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true }) : "—";
export function timeAgo(d: Date | string) {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
export const isIndianMobile = (p: string) => /^[6-9]\d{9}$/.test(p.replace(/^\+?91/, "").replace(/\s/g, ""));
export const toE164 = (p: string) => "+91" + p.replace(/^\+?91/, "").replace(/\D/g, "");
export const STATUS_LABEL: Record<string, string> = {
  planned: "Planned", offered: "Finding helper", accepted: "Helper assigned", en_route: "On the way", arrived: "Arrived",
  in_progress: "In progress", awaiting_approval: "Needs your approval", approved: "Done", rework: "Rework scheduled",
  cancelled: "Cancelled", failed: "Could not complete",
};
