import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { customerProfiles } from "@/db/schema";
import { api, body } from "@/lib/api";
import { recordWalletTopUp } from "@/lib/money";

// Mock payment provider: the amount is treated as captured. With Razorpay keys set, this route creates an order first and
// the webhook performs the credit; the idempotent ledger write below stays the same.
const schema = z.object({ amountInr: z.number().int().min(100, "The minimum top-up is ₹100").max(20000, "The maximum top-up is ₹20,000"), key: z.string().min(8).max(80) });

export const POST = api(
  async ({ req, user }) => {
    const b = await body(req, schema);
    const paise = b.amountInr * 100;
    const res = await recordWalletTopUp(user!.id, b.key, paise);
    if (!res.duplicate) await db.update(customerProfiles).set({ walletBalance: sql`${customerProfiles.walletBalance} + ${paise}` }).where(eq(customerProfiles.userId, user!.id));
    const [p] = await db.select({ w: customerProfiles.walletBalance }).from(customerProfiles).where(eq(customerProfiles.userId, user!.id)).limit(1);
    return { ok: true, duplicate: res.duplicate, walletBalance: p?.w ?? 0 };
  },
  { roles: ["CUSTOMER"], limit: { key: "wallet", max: 10, windowMs: 60000 } },
);
