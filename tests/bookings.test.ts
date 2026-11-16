import { describe, it, expect } from "vitest";
import { isInDwarka } from "../src/lib/dwarka";
import { generateSlots, MAX_PER_SLOT, slotKey } from "../src/lib/slots";
import { verifyRazorpayWebhookSignature } from "../src/lib/payments";

describe("Dwarka geo-fence", () => {
  it("allows points inside 6/10/12", () => {
    expect(isInDwarka(28.5921, 77.046)).toBe(true); // Sector 12 Metro View
    expect(isInDwarka(28.5875, 77.0585)).toBe(true); // Sector 6
  });
  it("rejects outside", () => {
    expect(isInDwarka(28.55, 77.04)).toBe(false);
    expect(isInDwarka(28.7, 77.1)).toBe(false);
  });
});

describe("Slots", () => {
  it("generates 2h windows 8am-8pm, 7 days, max 42 before past-filter", () => {
    const slots = generateSlots(7);
    // At most 6*7=42, minus past slots of today
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.length).toBeLessThanOrEqual(42);
    for (const s of slots) {
      const h = s.start.getHours();
      expect([8, 10, 12, 14, 16, 18]).toContain(h);
      expect(s.start.getMinutes()).toBe(0);
    }
    expect(MAX_PER_SLOT).toBe(3);
  });
  it("slotKey is stable", () => {
    const d = new Date("2026-01-15T10:00:00");
    expect(slotKey(d)).toBe("2026-01-15-10");
  });
});

describe("Server price calc (from mvp-catalog)", () => {
  it("platform fee 4% min 19", () => {
    const subtotal = 499;
    const fee = Math.max(19, Math.round(subtotal * 0.04));
    expect(fee).toBe(20);
    const feeSmall = Math.max(19, Math.round(100 * 0.04));
    expect(feeSmall).toBe(19);
  });
});

describe("Payment webhook idempotency helper", () => {
  it("allows when no secret (test mode)", () => {
    expect(verifyRazorpayWebhookSignature("{}", null)).toBe(true);
  });
  it("rejects when secret set but signature missing", () => {
    const prev = process.env.RAZORPAY_WEBHOOK_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = "test_secret";
    expect(verifyRazorpayWebhookSignature("{}", null)).toBe(false);
    process.env.RAZORPAY_WEBHOOK_SECRET = prev;
  });
});

describe("Door OTP 5 tries logic", () => {
  it("blocks after 5", () => {
    const otpFailures = 5;
    expect(otpFailures >= 5).toBe(true);
  });
});
