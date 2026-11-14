export const TASK_PROGRESS: Record<string, number> = { planned: 0, offered: 5, accepted: 15, en_route: 30, arrived: 45, in_progress: 60, rework: 60, awaiting_approval: 90, approved: 100, cancelled: 100, failed: 100 };
export const planPercent = (statuses: string[]) => {
  const live = statuses.filter((s) => s !== "cancelled");
  if (!live.length) return 0;
  return Math.round(live.reduce((s, x) => s + (TASK_PROGRESS[x] ?? 0), 0) / live.length);
};
export const STEPS = ["planned", "accepted", "en_route", "in_progress", "awaiting_approval", "approved"] as const;
export const STEP_LABEL: Record<string, string> = { planned: "Planned", accepted: "Helper assigned", en_route: "On the way", in_progress: "In progress", awaiting_approval: "Your approval", approved: "Done" };
