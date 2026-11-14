// Pricing engine. Prices ALWAYS come from here, never from a model.
// All amounts are integer paise. Config is a plain object so ops can edit it
// (Phase 1 stores versions in a PricingConfig table with effective dates).

export type Urgency = "normal" | "same_day" | "rush";

export type PricingConfig = {
  version: number;
  urgency: Record<Urgency, number>;
  feePercent: number; // platform fee percent of subtotal
  feeFloor: number; // paise
  coordinationFee: number; // paise, applies for 3+ tasks or Managed
  coordinationMinTasks: number;
  minOrder: number; // paise
  circle: { perJoiner: number; max: number }; // discount curve, fraction
  sizeFactors: Record<string, number>;
  rangeSpread: number; // +/- fraction for price ranges before approval
};

export const DEFAULT_CONFIG: PricingConfig = {
  version: 1,
  urgency: { normal: 1.0, same_day: 1.2, rush: 1.5 },
  feePercent: 0.08,
  feeFloor: 2900,
  coordinationFee: 4900,
  coordinationMinTasks: 3,
  minOrder: 14900,
  circle: { perJoiner: 0.04, max: 0.2 },
  sizeFactors: { small: 0.8, medium: 1, large: 1.3 },
  rangeSpread: 0.12,
};

export type TaskInput = {
  baseRate: number; // paise per unit
  quantity: number;
  size?: keyof PricingConfig["sizeFactors"] | string;
};

export type EstimateInput = {
  tasks: TaskInput[];
  urgency?: Urgency;
  circleJoiners?: number; // neighbours in the circle including you
  travel?: number; // paise, zero inside a society
  managed?: boolean;
};

export type Estimate = {
  lines: number[];
  subtotal: number;
  urgencyMultiplier: number;
  circleDiscount: number;
  urgencyAmount: number; // subtotal after urgency and circle
  travel: number;
  platformFee: number;
  coordinationFee: number;
  total: number;
  minOrderApplied: boolean;
  low: number;
  high: number;
};

/** Circle discount: curve(joiners) with a floor of 0 and a cap of config.circle.max */
export function circleDiscount(joiners: number, cfg: PricingConfig = DEFAULT_CONFIG): number {
  if (!Number.isFinite(joiners) || joiners <= 1) return 0;
  const d = (joiners - 1) * cfg.circle.perJoiner;
  return Math.min(cfg.circle.max, Math.round(d * 1000) / 1000);
}

export function estimate(input: EstimateInput, cfg: PricingConfig = DEFAULT_CONFIG): Estimate {
  const urgency = input.urgency ?? "normal";
  const lines = input.tasks.map((t) => {
    const factor = cfg.sizeFactors[t.size ?? "medium"] ?? 1;
    return Math.round(t.baseRate * Math.max(0, t.quantity) * factor);
  });
  const subtotal = lines.reduce((a, b) => a + b, 0);
  const urgencyMultiplier = cfg.urgency[urgency];
  const discount = circleDiscount(input.circleJoiners ?? 1, cfg);
  const urgencyAmount = Math.round(subtotal * urgencyMultiplier * (1 - discount));
  const travel = Math.max(0, input.travel ?? 0);
  const platformFee = subtotal === 0 ? 0 : Math.max(cfg.feeFloor, Math.round(cfg.feePercent * subtotal));
  const coordinationFee =
    subtotal > 0 && (input.managed || input.tasks.length >= cfg.coordinationMinTasks) ? cfg.coordinationFee : 0;
  let total = urgencyAmount + travel + platformFee + coordinationFee;
  let minOrderApplied = false;
  if (subtotal > 0 && total < cfg.minOrder) {
    total = cfg.minOrder;
    minOrderApplied = true;
  }
  return {
    lines,
    subtotal,
    urgencyMultiplier,
    circleDiscount: discount,
    urgencyAmount,
    travel,
    platformFee,
    coordinationFee,
    total,
    minOrderApplied,
    low: Math.round((total * (1 - cfg.rangeSpread)) / 100) * 100,
    high: Math.round((total * (1 + cfg.rangeSpread)) / 100) * 100,
  };
}

export function rupees(paise: number): string {
  return "₹" + Math.round(paise / 100).toLocaleString("en-IN");
}
