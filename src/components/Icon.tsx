// Custom icon set. One consistent 2px line style, sand/sage spot fill offset like a misregistered print.
// The wobble comes from the #wobble filter defined once in <SvgDefs/>.

const ICONS = {
  home: "M8 24 L24 10 L40 24 V40 H8 Z M6 24 L24 8 L42 24 M20 40 V30 H28 V40",
  bag: "M10 18 H38 L40 42 H8 Z M17 18 V14 a7 7 0 0 1 14 0 V18",
  hanger: "M24 20 L42 34 H6 Z M24 20 V16 a4 4 0 1 0 -4 -4",
  broom: "M26 26 L38 38 L32 44 L20 32 Z M42 6 L24 28 M22 34 L16 40 M27 38 L22 43",
  plant: "M14 30 H34 L31 42 H17 Z M24 30 V16 M24 20 C24 12 16 10 12 12 C12 18 18 22 24 20 M24 24 C24 16 32 14 36 16 C36 22 30 26 24 24",
  parcel: "M6 16 L24 8 L42 16 V34 L24 42 L6 34 Z M6 16 L24 24 L42 16 M24 24 V42 M15 12 L33 20",
  pan: "M6 22 H34 V32 a4 4 0 0 1 -4 4 H10 a4 4 0 0 1 -4 -4 Z M34 24 H44 M14 16 q2 -3 0 -6 M22 16 q2 -3 0 -6",
  lamp: "M14 8 H34 L40 26 H8 Z M24 26 V38 M16 42 H32",
  key: "M7 30 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M23 24 L42 8 M36 14 L40 18 M31 19 L34 22",
  bicycle: "M4 34 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M28 34 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M12 34 L20 16 H32 L36 34 M20 16 L26 34 M18 12 H24",
  phone: "M14 6 H34 a3 3 0 0 1 3 3 V39 a3 3 0 0 1 -3 3 H14 a3 3 0 0 1 -3 -3 V9 a3 3 0 0 1 3 -3 Z M21 37 H27",
  scooter: "M6 38 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M32 38 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M16 38 H28 L34 12 H40 M30 12 H34 M14 38 L12 28 H24",
  cart: "M12 14 H42 L38 32 H16 Z M4 8 H10 L16 32 M18 40 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 M32 40 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0",
  balloon: "M24 6 C34 6 38 14 36 22 C34 30 28 32 24 34 C20 32 14 30 12 22 C10 14 14 6 24 6 Z M24 34 L22 38 L26 40 L24 44",
  laptop: "M10 12 H38 V32 H10 Z M4 38 H44 L40 32 H8 Z",
  book: "M6 10 Q15 8 24 12 Q33 8 42 10 V38 Q33 36 24 40 Q15 36 6 38 Z M24 12 V40",
  dog: "M10 28 C8 18 14 12 22 14 H34 L42 22 L36 25 V38 H30 V30 H18 V38 H12 Z M32 19 L32.5 19",
  box: "M6 18 L10 8 H38 L42 18 V42 H6 Z M6 18 H42 M20 18 V26 H28 V18",
  wrench: "M30 6 a10 10 0 0 0 -4 14 L8 38 a4 4 0 0 0 6 6 L32 26 a10 10 0 0 0 14 -4 L40 24 L34 18 L36 12 Z",
  queue: "M10 12 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M4 40 V32 a11 11 0 0 1 22 0 V40 Z M30 16 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M30 28 a8 8 0 0 1 14 5 V40 H32",
  ball: "M6 24 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 M24 6 V42 M6 24 H42 M11 12 Q24 24 11 36 M37 12 Q24 24 37 36",
  gamepad: "M8 16 H40 a4 4 0 0 1 4 4 V30 a6 6 0 0 1 -11 3 L31 32 H17 L15 33 A6 6 0 0 1 4 30 V20 a4 4 0 0 1 4 -4 Z M14 22 V30 M10 26 H18 M32 24 L32.5 24 M37 28 L37.5 28",
  clock: "M6 24 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 M24 12 V24 L32 29",
  shield: "M24 6 L40 12 V24 C40 34 32 40 24 44 C16 40 8 34 8 24 V12 Z M16 24 L22 30 L32 18",
  check: "M8 26 L20 38 L40 12 M6 6 H8",
  pin: "M24 44 C14 32 10 26 10 20 a14 14 0 0 1 28 0 C38 26 34 32 24 44 Z M18 20 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0",
  lift: "M10 6 H38 V42 H10 Z M24 6 V42 M16 20 L19 16 L22 20 M26 28 L29 32 L32 28",
  door: "M12 42 V8 H32 V42 M8 42 H40 M27 26 L27.5 26",
  chat: "M6 10 H42 V32 H20 L10 42 V32 H6 Z M14 18 H34 M14 24 H26",
  camera: "M6 14 H14 L18 8 H30 L34 14 H42 V38 H6 Z M16 26 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0",
  mic: "M18 12 a6 6 0 0 1 12 0 V24 a6 6 0 0 1 -12 0 Z M10 22 a14 14 0 0 0 28 0 M24 36 V44 M16 44 H32",
  wallet: "M6 12 H38 V18 M6 12 V40 H42 V18 H10 M32 29 L32.5 29",
  star: "M24 6 L29 18 L42 19 L32 28 L35 41 L24 34 L13 41 L16 28 L6 19 L19 18 Z",
  heart: "M24 40 C8 28 6 18 12 12 C17 8 22 11 24 16 C26 11 31 8 36 12 C42 18 40 28 24 40 Z",
  gift: "M6 18 H42 V26 H6 Z M10 26 V42 H38 V26 M24 18 V42 M24 18 C18 6 10 12 18 18 M24 18 C30 6 38 12 30 18",
  calendar: "M6 10 H42 V42 H6 Z M6 20 H42 M14 5 V14 M34 5 V14",
  truck: "M4 14 H30 V34 H4 Z M30 22 H38 L44 28 V34 H30 M8 38 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M32 38 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0",
  bell: "M24 6 C16 6 12 12 12 20 V28 L8 34 H40 L36 28 V20 C36 12 32 6 24 6 Z M20 38 a4 4 0 0 0 8 0",
  sofa: "M4 26 a4 4 0 0 1 8 0 V30 H36 V26 a4 4 0 0 1 8 0 V38 H4 Z M8 22 V14 a4 4 0 0 1 4 -4 H36 a4 4 0 0 1 4 4 V22 M10 38 V42 M38 38 V42",
  cake: "M8 26 H40 V42 H8 Z M8 34 Q14 38 20 34 T32 34 T40 34 M24 26 V18 M24 12 q3 3 0 6 q-3 -3 0 -6",
} as const;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

export function Icon({
  name,
  size = 40,
  tone = "sand",
  className,
  title,
}: {
  name: IconName | string;
  size?: number;
  tone?: "sand" | "sage" | "none";
  className?: string;
  title?: string;
}) {
  const d = (ICONS as Record<string, string>)[name] ?? ICONS.box;
  const spot = "M" + d.split("M")[1];
  const fill = tone === "sage" ? "var(--color-sage)" : "var(--color-sand)";
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {tone !== "none" && <path d={spot} fill={fill} opacity="0.75" transform="translate(2.5 2.5)" />}
      <g filter="url(#wobble)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </g>
    </svg>
  );
}

/** Shared SVG filters: hand wobble for icons, ink-bleed for stamps. Rendered once in the root layout. */
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="0.8" />
        </filter>
        <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="1.2" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.25" />
        </filter>
      </defs>
    </svg>
  );
}

/** The SHELL wordmark: rounded lettering, the counter of the S drawn as a small shell spiral. */
export function Wordmark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label="SHELL">
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
        <circle cx="20" cy="20" r="18" fill="var(--color-sand)" />
        <path
          d="M20 20 m0 0 c0 -3 4 -3 4 0 c0 5 -8 5 -8 -1 c0 -8 12 -8 12 1 c0 10 -16 10 -16 -2"
          fill="none"
          stroke="var(--color-tide)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      <span className="display text-[1.35em] leading-none tracking-tight" style={{ fontSize: size * 0.9 }}>
        SHELL
      </span>
    </span>
  );
}
