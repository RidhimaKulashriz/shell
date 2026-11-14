import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, circleDiscount, estimate } from "../src/lib/pricing";
import { runKeywordEngine, DEMO_SENTENCE } from "../src/lib/keywords";
import { scanMessage } from "../src/lib/leakage";
import { distanceMetres } from "../src/lib/geo";
import { normalisePhone } from "../src/lib/server";

const cleaning = { baseRate: 16000, quantity: 3 };

describe("pricing engine", () => {
  it("applies platform fee floor on small orders", () => {
    const e = estimate({ tasks: [{ baseRate: 5000, quantity: 1 }] });
    expect(e.platformFee).toBe(DEFAULT_CONFIG.feeFloor);
    expect(e.minOrderApplied).toBe(true);
    expect(e.total).toBe(DEFAULT_CONFIG.minOrder);
  });
  it("uses percent fee above the floor", () => {
    const e = estimate({ tasks: [{ baseRate: 100000, quantity: 1 }] });
    expect(e.platformFee).toBe(8000);
  });
  it("adds a coordination fee for 3+ tasks or Managed", () => {
    expect(estimate({ tasks: [cleaning] }).coordinationFee).toBe(0);
    expect(estimate({ tasks: [cleaning], managed: true }).coordinationFee).toBe(DEFAULT_CONFIG.coordinationFee);
    expect(estimate({ tasks: [cleaning, cleaning, cleaning] }).coordinationFee).toBe(DEFAULT_CONFIG.coordinationFee);
  });
  it("applies urgency multipliers", () => {
    const n = estimate({ tasks: [cleaning] });
    const r = estimate({ tasks: [cleaning], urgency: "rush" });
    expect(r.urgencyAmount).toBe(Math.round(n.subtotal * 1.5));
    expect(estimate({ tasks: [cleaning], urgency: "same_day" }).urgencyAmount).toBe(Math.round(n.subtotal * 1.2));
  });
  it("applies size factors", () => {
    expect(estimate({ tasks: [{ ...cleaning, size: "large" }] }).subtotal).toBe(Math.round(48000 * 1.3));
  });
  it("circle discount curve has a floor and a cap", () => {
    expect(circleDiscount(1)).toBe(0);
    expect(circleDiscount(0)).toBe(0);
    expect(circleDiscount(3)).toBeCloseTo(0.08);
    expect(circleDiscount(50)).toBe(DEFAULT_CONFIG.circle.max);
  });
  it("total equals sum of its lines plus fees", () => {
    const e = estimate({ tasks: [cleaning, cleaning, cleaning], urgency: "same_day", circleJoiners: 4, travel: 1000 });
    expect(e.total).toBe(e.urgencyAmount + e.travel + e.platformFee + e.coordinationFee);
  });
});

describe("keyword demo engine", () => {
  it("turns the demo sentence into five tasks", () => {
    const r = runKeywordEngine(DEMO_SENTENCE);
    expect(r.kind).toBe("match");
    if (r.kind === "match") {
      const slugs = r.items.map((i) => i.slug);
      expect(slugs).toEqual(expect.arrayContaining(["house-cleaning", "groceries", "wardrobe-organising", "decoration", "event-help"]));
    }
  });
  it("matches Hinglish keywords", () => {
    const r = runKeywordEngine("bartan aur jhaadu pocha karwana hai");
    expect(r.kind === "match" && r.items.map((i) => i.slug)).toEqual(["house-cleaning", "utensils"]);
  });
  it("blocks banned categories", () => {
    expect(runKeywordEngine("ghar pe massage chahiye").kind).toBe("banned");
  });
  it("returns none for unknown text", () => {
    expect(runKeywordEngine("rocket banana hai").kind).toBe("none");
  });
});

describe("leakage scanner", () => {
  it("flags digits", () => expect(scanMessage("call me 9876543210")).toContain("phone"));
  it("flags spelled-out English digits", () => expect(scanMessage("nine eight seven six five four three two one zero")).toContain("phone"));
  it("flags Hinglish spelled-out digits", () => expect(scanMessage("nau aath saat chhe paanch char teen do ek shunya")).toContain("phone"));
  it("flags Devanagari numerals", () => expect(scanMessage("मेरा नंबर ९८७६५४३२१०")).toContain("phone"));
  it("flags UPI ids", () => expect(scanMessage("pay me rahul@oksbi")).toContain("upi"));
  it("flags emails and handles", () => {
    expect(scanMessage("mail a.b@gmail.com")).toContain("email");
    expect(scanMessage("insta id pe aao @rahul_k")).toContain("social");
  });
  it("leaves normal chat alone", () => expect(scanMessage("Main 5 baje tak 3 kamre saaf kar dunga")).toEqual([]));
});

describe("geo and phone helpers", () => {
  it("computes distance for the 150 m geofence", () => {
    const d = distanceMetres([28.5921, 77.046], [28.5931, 77.046]);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);
  });
  it("normalises Indian mobiles", () => {
    expect(normalisePhone("+91 98765 43210")).toBe("+919876543210");
    expect(normalisePhone("09876543210")).toBe("+919876543210");
    expect(normalisePhone("1234567890")).toBeNull();
  });
});
