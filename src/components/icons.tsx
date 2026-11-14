import type { ReactNode } from "react";

// One custom line-icon set: 24px grid, 1.8px rounded strokes, soft sage spot fill.
const I: Record<string, ReactNode> = {
  home: <><path className="spot" d="M5 11l7-6 7 6v8H5z" /><path d="M4 12l8-7 8 7M6.5 10.5V20h11v-9.5M10 20v-5h4v5" /></>,
  bag: <><path className="spot" d="M5 8h14l-1 12H6z" /><path d="M5 8h14l-1 12H6zM9 8V6.5a3 3 0 016 0V8" /></>,
  hanger: <><path className="spot" d="M3 18l9-6 9 6z" /><path d="M12 12V10a2 2 0 10-2-2M3 18l9-6 9 6z" /></>,
  broom: <><path className="spot" d="M7 14l5-2 4 7H5z" /><path d="M17 3l-5 9M7 14l5-2 4 7H5zM8 17l-1 2M11 18l-1 1.5" /></>,
  plant: <><path className="spot" d="M7 14h10l-1.5 6h-7z" /><path d="M7 14h10l-1.5 6h-7zM12 14V9M12 10c0-3 2-4 5-4 0 3-2 4-5 4zM12 12c0-2-1.500-3-4-3 0 2.500 1.500 3.500 4 3z" /></>,
  parcel: <><path className="spot" d="M4 8l8-4 8 4v9l-8 4-8-4z" /><path d="M4 8l8 4 8-4M12 12v9M4 8v9l8 4 8-4V8l-8-4zM8 6l8 4" /></>,
  pan: <><circle className="spot" cx="10" cy="12" r="6" /><circle cx="10" cy="12" r="6" /><path d="M16 12h6M7 10a4 4 0 012-1.500" /></>,
  lamp: <><path className="spot" d="M8 4h8l3 9H5z" /><path d="M8 4h8l3 9H5zM12 13v6M8.500 20h7" /></>,
  key: <><circle className="spot" cx="8" cy="12" r="4" /><circle cx="8" cy="12" r="4" /><path d="M12 12h9M18 12v3M21 12v2" /></>,
  bicycle: <><circle cx="6" cy="16" r="3.500" /><circle cx="18" cy="16" r="3.500" /><path className="spot" d="M6 16l4-7h6l2 7z" /><path d="M6 16l4-7h6l2 7M10 9L9 6.500H7M16 9l-1-2.500h-2" /></>,
  phone: <><rect className="spot" x="7" y="3" width="10" height="18" rx="2.500" /><rect x="7" y="3" width="10" height="18" rx="2.500" /><path d="M11 18h2" /></>,
  scooter: <><circle cx="6" cy="17" r="2.500" /><circle cx="18" cy="17" r="2.500" /><path className="spot" d="M8 17h8l-1-6H9z" /><path d="M8.500 17h6.500l-1-7h-3M17 9l1 8M15 7h3" /></>,
  shield: <><path className="spot" d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM9 12l2 2 4-4" /></>,
  clock: <><circle className="spot" cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="8" /><path d="M12 7.500V12l3 2" /></>,
  check: <path d="M5 12.500l4.500 4.500L19 7" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  user: <><circle className="spot" cx="12" cy="8" r="4" /><circle cx="12" cy="8" r="4" /><path d="M4.500 20c1-4 4-6 7.500-6s6.500 2 7.500 6" /></>,
  map: <><path className="spot" d="M12 21s-6-5.500-6-10a6 6 0 0112 0c0 4.500-6 10-6 10z" /><path d="M12 21s-6-5.500-6-10a6 6 0 0112 0c0 4.500-6 10-6 10z" /><circle cx="12" cy="11" r="2" /></>,
  wallet: <><rect className="spot" x="3" y="6" width="18" height="13" rx="3" /><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18M16 14.500h2" /></>,
  bell: <><path className="spot" d="M6 17V11a6 6 0 0112 0v6z" /><path d="M6 17V11a6 6 0 0112 0v6zM4.500 17h15M10 20h4" /></>,
  chat: <><path className="spot" d="M4 6h16v10H9l-5 4z" /><path d="M4 6h16v10H9l-5 4zM8 10h8M8 13h5" /></>,
  camera: <><rect className="spot" x="3" y="7" width="18" height="12" rx="3" /><rect x="3" y="7" width="18" height="12" rx="3" /><circle cx="12" cy="13" r="3.500" /><path d="M8 7l1.500-2.500h5L16 7" /></>,
  mic: <><rect className="spot" x="9" y="3" width="6" height="11" rx="3" /><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.500 11a6.500 6.500 0 0013 0M12 17.500V21" /></>,
  star: <path className="spot-stroke" d="M12 4l2.400 5 5.500.7-4 3.800 1 5.500L12 16.400 7.100 19l1-5.500-4-3.800L9.600 9z" />,
  circle: <><circle className="spot" cx="8" cy="9" r="3" /><circle cx="8" cy="9" r="3" /><circle cx="17" cy="10" r="2.500" /><path d="M3 19c.5-3 2.500-5 5-5s4.500 2 5 5M14.500 15c2.500-.5 5 1 5.500 4" /></>,
  receipt: <><path className="spot" d="M6 3h12v18l-2-1.500-2 1.500-2-1.500-2 1.500-2-1.500L6 21z" /><path d="M6 3h12v18l-2-1.500-2 1.500-2-1.500-2 1.500-2-1.500L6 21zM9 8h6M9 12h6M9 16h3" /></>,
  qr: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h3v3h-3zM19 14v1M14 19h2M19 18v2" /></>,
  alert: <><path className="spot" d="M12 4l9 16H3z" /><path d="M12 4l9 16H3zM12 10v4.500M12 17.200v.1" /></>,
  calendar: <><rect className="spot" x="4" y="6" width="16" height="14" rx="2.500" /><rect x="4" y="6" width="16" height="14" rx="2.500" /><path d="M4 10.500h16M8 4v4M16 4v4" /></>,
  pin: <><path className="spot" d="M12 21s-6-5.500-6-10a6 6 0 0112 0c0 4.500-6 10-6 10z" /><circle cx="12" cy="11" r="2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  passport: <><rect className="spot" x="5" y="3" width="14" height="18" rx="2" /><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M9 16h6" /></>,
  gate: <><path className="spot" d="M4 20V9l8-5 8 5v11z" /><path d="M4 20V9l8-5 8 5v11M8 20v-7h8v7M12 13v7" /></>,
  flame: <path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" />,
  gift: <><rect className="spot" x="4" y="9" width="16" height="11" rx="1" /><rect x="4" y="9" width="16" height="11" rx="1" /><path d="M3 9h18v-3H3zM12 6v14M12 6c-2-3-5-2.500-4.500 0 .5 1 3 0 4.500 0zm0 0c2-3 5-2.500 4.500 0-.5 1-3 0-4.500 0z" /></>,
  heart: <path d="M12 20s-7-4.500-7-10a4 4 0 017-2.500A4 4 0 0119 10c0 5.500-7 10-7 10z" />,
  tool: <path d="M14 6a4 4 0 005 5l-9 9-3-3 9-9a4 4 0 00-2-2zM6 17l1 1" />,
  upload: <path d="M12 16V5M7 10l5-5 5 5M5 19h14" />,
  logout: <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></>,
  lock: <><rect className="spot" x="5" y="10" width="14" height="10" rx="2" /><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></>,
  chart: <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" />,
};
export const ICON_NAMES = Object.keys(I);

export function Icon({ name, size = 22, className = "", title }: { name: string; size?: number; className?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {I[name] ?? I.home}
    </svg>
  );
}

export function Logo({ size = 28, light = false, text = true }: { size?: number; light?: boolean; text?: boolean }) {
  const c = light ? "#daf1de" : "#051f20";
  return (
    <span className="inline-flex items-center gap-2" aria-label="Shell">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
        <circle cx="20" cy="20" r="18" fill={light ? "#163832" : "#daf1de"} />
        <path d="M20 31c-6.500 0-11-4.500-11-9.500 0-4.500 3-7.500 7.500-7.500 3.700 0 6 2.300 6 5.200 0 2.300-1.500 3.800-3.600 3.800-1.600 0-2.600-1-2.600-2.400" stroke={c} strokeWidth="2.600" strokeLinecap="round" />
        <circle cx="29" cy="13" r="2.200" fill="#f2c318" />
      </svg>
      {text && <span className="serif text-[1.35rem] font-bold tracking-[0.08em]" style={{ color: c }}>SHELL</span>}
    </span>
  );
}
