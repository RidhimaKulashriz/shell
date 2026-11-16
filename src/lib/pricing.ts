// Pricing engine. Prices ALWAYS come from here, never from the plan-drafting model.
//
// task_price      = base_rate x quantity x size_factor
// subtotal        = sum(task_price)
// travel          = from the geo layer (0 inside the society)
// urgency         = normal 1.0 | same_day 1.2 | rush 1.5
// circle_discount = curve(joiners), capped at maxCircleDiscount
// platform_fee    = max(fee_floor, percent x subtotal)
// coordination    = applies when >= 3 tasks or plan is Managed
// total           = round(subtotal x urgency x (1 - circle_discount)) + travel + platform_fee + coordination
// minimum order value tops the total up (shown as its own line).
// All money is integer paise.

export type Urgency = "normal" | "same_day" | "rush";
export type Size = "small" | "medium" | "large";

export type PricingConfig = {
  version: number;
  urgency: Record<Urgency, number>;
  minOrder: number;
  feeFloor: number;
  feePercent: number;
  coordinationFee: number;
  coordinationMinTasks: number;
  circleCurve: { flats: number; discount: number }[];
  maxCircleDiscount: number;
  travelPerKm: number;
  rangePct: number;
  commissionPct: Record<string, number>;
  surge: { festival: number; lateNight: number };
  instantPayoutFeePct: number;
  gstPct: number;
  societyOverrides: Record<string, { feeFloor?: number }>;
};

export const DEFAULT_PRICING: PricingConfig = {
  version: 1,
  urgency: { normal: 1, same_day: 1.2, rush: 1.5 },
  minOrder: 19900,
  feeFloor: 2900,
  feePercent: 0.06,
  coordinationFee: 7900,
  coordinationMinTasks: 3,
  circleCurve: [
    { flats: 1, discount: 0 },
    { flats: 2, discount: 0.05 },
    { flats: 3, discount: 0.1 },
    { flats: 4, discount: 0.15 },
    { flats: 5, discount: 0.18 },
    { flats: 6, discount: 0.2 },
  ],
  maxCircleDiscount: 0.25,
  travelPerKm: 1500,
  rangePct: 0.12,
  commissionPct: { STARTER: 0.28, TRUSTED: 0.25, PRO: 0.22, ELITE: 0.2 },
  surge: { festival: 1.1, lateNight: 1.15 },
  instantPayoutFeePct: 0.01,
  gstPct: 0.18,
  societyOverrides: {},
};

export type TemplateLike = {
  slug: string;
  name: string;
  baseRate: number;
  unit: string;
  minutesPerUnit: number;
  sizeFactors: { small: number; medium: number; large: number };
  managedOnly?: boolean;
};
export type LineInput = { template: TemplateLike; qty: number; size: Size };

export type QuoteInput = {
  lines: LineInput[];
  urgency?: Urgency;
  circleJoiners?: number;
  travelPaise?: number;
  managed?: boolean;
  festival?: boolean;
  config?: PricingConfig;
};

export type Quote = {
  lines: { slug: string; name: string; qty: number; size: Size; price: number; minutes: number }[];
  subtotal: number;
  urgencyMultiplier: number;
  circleDiscount: number;
  adjustedSubtotal: number;
  travel: number;
  platformFee: number;
  coordinationFee: number;
  minOrderTopUp: number;
  total: number;
  range: [number, number];
  minutes: number;
  managed: boolean;
  configVersion: number;
};

export const roundRupee = (p: number) => Math.round(p / 100) * 100;

export function circleDiscount(joiners: number, cfg: PricingConfig = DEFAULT_PRICING) {
  if (joiners <= 1) return 0;
  const curve = [...cfg.circleCurve].sort((a, b) => a.flats - b.flats);
  let d = 0;
  for (const p of curve) if (joiners >= p.flats) d = p.discount;
  return Math.min(d, cfg.maxCircleDiscount);
}

export function linePrice(l: LineInput) {
  const factor = l.template.sizeFactors[l.size] ?? 1;
  const qty = Math.max(1, Math.floor(l.qty));
  return { price: roundRupee(l.template.baseRate * qty * factor), minutes: Math.round(l.template.minutesPerUnit * qty * (factor > 1 ? 1 + (factor - 1) * 0.6 : 1)) };
}

export function quote(input: QuoteInput): Quote {
  const cfg = input.config ?? DEFAULT_PRICING;
  const urgency = input.urgency ?? "normal";
  const lines = input.lines.map((l) => {
    const { price, minutes } = linePrice(l);
    return { slug: l.template.slug, name: l.template.name, qty: Math.max(1, Math.floor(l.qty)), size: l.size, price, minutes };
  });
  const subtotal = lines.reduce((s, l) => s + l.price, 0);
  let urgencyMultiplier = cfg.urgency[urgency];
  if (input.festival) urgencyMultiplier = Math.round(urgencyMultiplier * cfg.surge.festival * 100) / 100;
  const disc = circleDiscount(input.circleJoiners ?? 1, cfg);
  const adjustedSubtotal = roundRupee(subtotal * urgencyMultiplier * (1 - disc));
  const managed = !!input.managed || lines.length >= cfg.coordinationMinTasks || input.lines.some((l) => l.template.managedOnly);
  const platformFee = lines.length ? roundRupee(Math.max(cfg.feeFloor, cfg.feePercent * subtotal)) : 0;
  const coordinationFee = managed && lines.length ? cfg.coordinationFee : 0;
  const travel = input.travelPaise ?? 0;
  let total = adjustedSubtotal + travel + platformFee + coordinationFee;
  let minOrderTopUp = 0;
  if (lines.length && total < cfg.minOrder) {
    minOrderTopUp = cfg.minOrder - total;
    total = cfg.minOrder;
  }
  const spread = cfg.rangePct;
  return {
    lines,
    subtotal,
    urgencyMultiplier,
    circleDiscount: disc,
    adjustedSubtotal,
    travel,
    platformFee,
    coordinationFee,
    minOrderTopUp,
    total,
    range: [roundRupee(total * (1 - spread)), roundRupee(total * (1 + spread))],
    minutes: lines.reduce((s, l) => s + l.minutes, 0),
    managed,
    configVersion: cfg.version,
  };
}

/** Invariant enforced in code: a plan total equals the sum of its lines plus fees. */
export function planTotalIsConsistent(p: { subtotal: number; urgencyMultiplier: number; circleDiscount: number; travelAmount: number; platformFee: number; coordinationFee: number; total: number }, minOrder = DEFAULT_PRICING.minOrder) {
  const expected = roundRupee(p.subtotal * p.urgencyMultiplier * (1 - p.circleDiscount)) + p.travelAmount + p.platformFee + p.coordinationFee;
  return p.total === expected || p.total === Math.max(expected, minOrder);
}

export function helperPayout(price: number, level: string, cfg: PricingConfig = DEFAULT_PRICING) {
  return Math.round(price * (1 - (cfg.commissionPct[level] ?? cfg.commissionPct.STARTER)));
}

/** Estimator: a transparent range, plus how much each Circle joiner would save. */
export function circleSavings(subtotal: number, cfg: PricingConfig = DEFAULT_PRICING) {
  return cfg.circleCurve.map((p) => ({ flats: p.flats, perFlat: roundRupee(subtotal * (1 - circleDiscount(p.flats, cfg))) }));
}
