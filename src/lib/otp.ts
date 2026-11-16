import crypto from "node:crypto";
import { sha } from "@/lib/auth";

const SECRET = process.env.APP_SECRET ?? "shell-dev-secret-change-me";

/** Door OTP: derived from the task id (so the customer app can always display it); only the hash is stored. */
export function doorOtp(taskId: string) {
  const h = crypto.createHmac("sha256", SECRET).update("door:" + taskId).digest("hex");
  return String(parseInt(h.slice(0, 8), 16) % 10000).padStart(4, "0");
}
export const doorOtpHash = (taskId: string) => sha("door:" + doorOtp(taskId));
export const checkDoorOtp = (taskId: string, code: string) => doorOtp(taskId) === code.trim();
