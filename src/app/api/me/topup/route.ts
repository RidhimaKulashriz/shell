import { route, ApiError } from "@/lib/api";
import { db } from "@/db";
import { customerProfiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { postJournal } from "@/lib/tasks";
// Demo top-up. In production this creates a Razorpay order and credits the wallet on webhook capture.
export const POST = route({ roles: ["CUSTOMER"] }, async ({ body, user }) => {
  const amt = Math.round(Number(body.amount) * 100);
  if (!amt || amt < 10000 || amt > 1000000) throw new ApiError("invalid", "Enter an amount between ₹100 and ₹10,000.");
  await db.update(customerProfiles).set({ walletBalance: sql`${customerProfiles.walletBalance} + ${amt}` }).where(eq(customerProfiles.userId, user.id));
  await postJournal([{ account: "customer_cash", debit: amt, memo: "Wallet top-up" }, { account: "customer_wallet", credit: amt, memo: "Wallet top-up" }], "topup", user.id);
  return { ok: true };
});
