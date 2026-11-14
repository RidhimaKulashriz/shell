// Pricing engine. All money in integer paise.
// Formula (also documented in /pricing and editable in Ops > Pricing):
//   task_price   = base_rate x quantity x size_factor x urgency x (1 - circle_discount)
//   subtotal     = sum(task_price)
//   platform_fee = max(fee_floor, pct x subtotal)
//   coordination = flat fee when 3+ tasks or any Managed task
//   total        = subtotal + travel + platform_fee + coordination + minimum_top_up - promo
export type Urgency = "normal" | "same_day" | "rush";
export type Size = "small" | "medium" | "large";

export type PricingConfig = {
  version: number;
  urgency: Record<Urgency, number>;
  sizeFactors: Record<Size, number>;
  platformFeePct: number;
  feeFloor: number;
  coordinationFee: number;
  coordinationMinTasks: number;
  minOrder: number;
  circleCurve: { joiners: number; discount: number }[];
  circleMaxDiscount: number;
  helperShare: number;
  gstPct: number;
  travelOutsideSociety: number;
  holdHours: number;
  promos: Record<string, { flat?: number; pct?: number; label: string }>;
};

export const DEFAULT_PRICING: PricingConfig = {
  version: 1,
  urgency: { normal: 1, same_day: 1.2, rush: 1.5 },
  sizeFactors: { small: 0.8, medium: 1, large: 1.4 },
  platformFeePct: 0.08,
  feeFloor: 4900,
  coordinationFee: 14900,
  coordinationMinTasks: 3,
  minOrder: 19900,
  circleCurve: [
    { joiners: 1, discount: 0 }, { joiners: 2, discount: 0.05 }, { joiners: 3, discount: 0.09 },
    { joiners: 4, discount: 0.13 }, { joiners: 5, discount: 0.16 }, { joiners: 6, discount: 0.18 },
  ],
  circleMaxDiscount: 0.2,
  helperShare: 0.8,
  gstPct: 18,
  travelOutsideSociety: 0,
  holdHours: 2,
  promos: {
    WELCOME100: { flat: 10000, label: "Rs 100 off your first plan" },
    TOWERC10: { pct: 0.1, label: "10% off for Tower C" },
  },
};

export type PriceLineInput = {
  slug: string; name: string; kind: string; rate: number; mins: number; quantity: number; size: Size;
};
export type PricedLine = PriceLineInput & { basePrice: number; price: number; durationMin: number; helperPayout: number };

const rupee = (p: number) => Math.round(p / 100) * 100;

export function circleDiscount(joiners: number, cfg: PricingConfig = DEFAULT_PRICING): number {
  let d = 0;
  for (const step of [...cfg.circleCurve].sort((a, b) => a.joiners - b.joiners)) if (joiners >= step.joiners) d = step.discount;
  return Math.min(d, cfg.circleMaxDiscount);
}

export type PlanPrice = {
  lines: PricedLine[]; urgencyMultiplier: number; circleDiscount: number; subtotal: number; travel: number;
  platformFee: number; coordinationFee: number; minTopUp: number; promoDiscount: number; total: number;
  durationMin: number; guarantee: true;
};

export function computePlan(opts: {
  lines: PriceLineInput[]; urgency?: Urgency; circleJoiners?: number; travel?: number; promo?: string | null;
  managed?: boolean; config?: PricingConfig;
}): PlanPrice {
  const cfg = opts.config ?? DEFAULT_PRICING;
  const urgency = opts.urgency ?? "normal";
  const um = cfg.urgency[urgency];
  const cd = circleDiscount(opts.circleJoiners ?? 1, cfg);
  const lines: PricedLine[] = opts.lines.map((l) => {
    const sf = cfg.sizeFactors[l.size] ?? 1;
    const basePrice = rupee(l.rate * l.quantity * sf);
    const price = rupee(basePrice * um * (1 - cd));
    return { ...l, basePrice, price, durationMin: Math.round(l.mins * l.quantity * sf), helperPayout: rupee(price * cfg.helperShare) };
  });
  const subtotal = lines.reduce((s, l) => s + l.price, 0);
  const travel = opts.travel ?? cfg.travelOutsideSociety;
  const platformFee = lines.length ? Math.max(cfg.feeFloor, rupee(cfg.platformFeePct * subtotal)) : 0;
  const managed = opts.managed || lines.some((l) => l.kind === "managed");
  const coordinationFee = lines.length >= cfg.coordinationMinTasks || (managed && lines.length >= 2) ? cfg.coordinationFee : 0;
  let total = subtotal + travel + platformFee + coordinationFee;
  const minTopUp = lines.length && total < cfg.minOrder ? cfg.minOrder - total : 0;
  total += minTopUp;
  let promoDiscount = 0;
  const promo = opts.promo ? cfg.promos[opts.promo.toUpperCase()] : undefined;
  if (promo) promoDiscount = Math.min(total, promo.flat ?? rupee((promo.pct ?? 0) * total));
  total -= promoDiscount;
  return {
    lines, urgencyMultiplier: um, circleDiscount: cd, subtotal, travel, platformFee, coordinationFee, minTopUp, promoDiscount, total,
    durationMin: lines.reduce((s, l) => s + l.durationMin, 0), guarantee: true,
  };
}

/** Invariant: total equals lines + fees - promo. */
export function planBalanced(p: { subtotal: number; travelAmount: number; platformFee: number; coordinationFee: number; minTopUp: number; promoDiscount: number; total: number }, lineSum: number) {
  return p.subtotal === lineSum && p.total === p.subtotal + p.travelAmount + p.platformFee + p.coordinationFee + p.minTopUp - p.promoDiscount;
}

/** Range shown before approval. */
export function priceRange(total: number): [number, number] {
  return [rupee(total * 0.92), rupee(total * 1.1)];
}

export function formatINR(paise: number): string {
  return "₹" + Math.round(paise / 100).toLocaleString("en-IN");
}
export function formatRange(total: number): string {
  const [a, b] = priceRange(total);
  return `${formatINR(a)} – ${formatINR(b)}`;
}
export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
