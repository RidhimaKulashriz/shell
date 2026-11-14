export const inr = (paise: number) => "₹" + Math.round(paise / 100).toLocaleString("en-IN");
export const inrRange = (a: number, b: number) => (Math.round(a / 100) === Math.round(b / 100) ? inr(a) : `${inr(a)} to ${inr(b)}`);
export const IST = "Asia/Kolkata";
export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleString("en-IN", { timeZone: IST, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric" });
}
export function minutesToText(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
