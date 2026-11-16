export const MACHINES = {
  request: {
    new: ["clarifying", "drafting", "cancelled"],
    clarifying: ["drafting", "cancelled"],
    drafting: ["in_review", "cancelled"],
    in_review: ["plan_sent", "cancelled"],
    plan_sent: ["approved", "in_review", "cancelled", "expired"],
    approved: [],
    cancelled: [],
    expired: [],
  },
  task: {
    planned: ["offered", "accepted", "cancelled"],
    offered: ["accepted", "planned", "cancelled"],
    accepted: ["en_route", "planned", "cancelled", "failed"],
    en_route: ["arrived", "cancelled", "failed"],
    arrived: ["in_progress", "failed", "cancelled"],
    in_progress: ["awaiting_approval", "cancelled"],
    awaiting_approval: ["approved", "rework"],
    rework: ["in_progress"],
    approved: [],
    cancelled: [],
    failed: [],
  },
  dispute: {
    open: ["under_review", "closed"],
    under_review: ["awaiting_info", "resolved"],
    awaiting_info: ["under_review", "resolved"],
    resolved: ["appealed", "closed"],
    appealed: ["resolved", "closed"],
    closed: [],
  },
  helper: {
    applied: ["review", "banned"],
    review: ["training", "applied", "banned"],
    training: ["shadow", "active", "banned"],
    shadow: ["active", "training", "banned"],
    active: ["paused", "suspended", "banned"],
    paused: ["active", "suspended", "banned"],
    suspended: ["active", "banned"],
    banned: [],
  },
  circle: {
    open: ["filling", "confirmed", "cancelled"],
    filling: ["confirmed", "cancelled", "open"],
    confirmed: ["full", "cancelled"],
    full: ["cancelled"],
    cancelled: [],
  },
  payment: {
    created: ["authorised", "captured", "failed"],
    authorised: ["captured", "failed"],
    captured: ["refunded", "partially_refunded"],
    partially_refunded: ["refunded", "partially_refunded"],
    failed: ["created"],
    refunded: [],
  },
} as const;

export type MachineName = keyof typeof MACHINES;

export function canTransition(machine: MachineName, from: string, to: string) {
  const m = MACHINES[machine] as Record<string, readonly string[]>;
  return !!m[from]?.includes(to);
}

export type TaskGuardCtx = { checkinAt?: Date | null; geofenceOk?: boolean; otpOk?: boolean; reworkCount?: number; approvedWithin24h?: boolean; helperKycOk?: boolean; approved?: boolean };

/** Guards on top of the plain transition table. Returns an error string or null. */
export function taskGuard(from: string, to: string, ctx: TaskGuardCtx = {}): string | null {
  if (!canTransition("task", from, to)) return `Cannot move a task from ${from} to ${to}`;
  if (to === "arrived" && !(ctx.geofenceOk && true)) return "Arrival needs a geofence match (within about 150 m of the address)";
  if (to === "in_progress" && from === "arrived" && !(ctx.otpOk && ctx.checkinAt)) return "A task cannot start without a check-in and the door OTP";
  if (to === "rework" && ((ctx.reworkCount ?? 0) >= 1 || ctx.approvedWithin24h === false)) return "Rework is allowed once, within 24 hours";
  return null;
}

export function payoutGuard(task: { status: string; approvedAt?: Date | null; autoApproveAt?: Date | null }, now = new Date()) {
  if (task.status === "approved") return null;
  if (task.status === "awaiting_approval" && task.autoApproveAt && task.autoApproveAt <= now) return null;
  return "Payout requires an approved or auto-approved task";
}

export function helperAgeOk(dob: Date, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return dob <= cutoff;
}

/** Progress used by the Readiness Ring. */
export function readinessPct(statuses: string[]) {
  const live = statuses.filter((s) => s !== "cancelled");
  if (!live.length) return 0;
  const weight: Record<string, number> = { planned: 0, offered: 0.05, accepted: 0.1, en_route: 0.25, arrived: 0.4, in_progress: 0.6, awaiting_approval: 0.95, rework: 0.7, approved: 1, failed: 0 };
  return Math.round((live.reduce((s, x) => s + (weight[x] ?? 0), 0) / live.length) * 100);
}

export type CircleStatus = (typeof MACHINES.circle extends infer M ? keyof M : never) & string;
export function nextCircleStatus(c: { current: number; min: number; max: number; cutoffAt: Date; status: string }, now = new Date()): string {
  if (c.status === "cancelled") return "cancelled";
  if (c.current >= c.max) return "full";
  if (c.current >= c.min) return "confirmed";
  if (now >= c.cutoffAt) return "cancelled";
  return c.current > 1 ? "filling" : "open";
}
