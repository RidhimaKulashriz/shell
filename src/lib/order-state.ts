export type OrderStatus =
  | "placed"
  | "confirmed"
  | "assigned"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "awaiting_approval"
  | "completed"
  | "rework"
  | "cancelled"
  | "failed";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["confirmed", "cancelled", "failed"],
  confirmed: ["assigned", "cancelled", "failed"],
  assigned: ["en_route", "cancelled", "failed"],
  en_route: ["arrived", "cancelled", "failed"],
  arrived: ["in_progress", "cancelled", "failed"],
  in_progress: ["awaiting_approval", "failed"],
  awaiting_approval: ["completed", "rework"],
  completed: ["rework"],
  rework: ["in_progress", "completed"],
  cancelled: [],
  failed: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionOrder(
  from: OrderStatus,
  to: OrderStatus,
  opts?: { doorOtpVerified?: boolean }
): OrderStatus {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`Invalid order transition from ${from} to ${to}`);
  }
  if (to === "in_progress" && from === "arrived" && !opts?.doorOtpVerified) {
    throw new Error("Door OTP verification is required to start the job");
  }
  return to;
}
