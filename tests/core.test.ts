import { describe, it, expect } from "vitest";
import { computePlan, circleDiscount, planBalanced, DEFAULT_PRICING, priceRange } from "@/lib/pricing";
import { draftFromText, detectBanned, questionsFor, applyAnswers } from "@/lib/engine";
import { scanMessage } from "@/lib/scanner";
import { haversine, withinGeofence, etaMinutes, hexId, hexCenter } from "@/lib/geo";
import { journalBalanced, levelFor } from "@/lib/tasks";
import { CATALOG, DEMO_TEXT } from "@/lib/catalog";

const line = (slug: string, quantity: number, size: "small" | "medium" | "large" = "medium") => { const c = CATALOG.find((x) => x.slug === slug)!; return { slug, name: c.name, kind: c.kind, rate: c.rate * 100, mins: c.mins, quantity, size }; };

describe("pricing engine", () => {
  it("applies the platform fee floor and minimum order", () => {
    const p = computePlan({ lines: [line("parcel-pickup", 1)] });
    expect(p.platformFee).toBe(DEFAULT_PRICING.feeFloor);
    expect(p.total).toBe(DEFAULT_PRICING.minOrder);
    expect(p.minTopUp).toBeGreaterThan(0);
  });
  it("uses a percentage fee above the floor", () => {
    const p = computePlan({ lines: [line("house-cleaning", 6, "large")] });
    expect(p.platformFee).toBeGreaterThan(DEFAULT_PRICING.feeFloor);
  });
  it("adds a coordination fee for 3+ tasks and not for 1", () => {
    expect(computePlan({ lines: [line("house-cleaning", 3)] }).coordinationFee).toBe(0);
    expect(computePlan({ lines: [line("house-cleaning", 3), line("groceries", 1), line("decoration", 2)] }).coordinationFee).toBe(DEFAULT_PRICING.coordinationFee);
  });
  it("applies urgency multipliers", () => {
    const n = computePlan({ lines: [line("house-cleaning", 4)] }).subtotal;
    expect(computePlan({ lines: [line("house-cleaning", 4)], urgency: "rush" }).subtotal).toBeGreaterThan(computePlan({ lines: [line("house-cleaning", 4)], urgency: "same_day" }).subtotal);
    expect(computePlan({ lines: [line("house-cleaning", 4)], urgency: "same_day" }).subtotal).toBeGreaterThan(n);
  });
  it("Circle discount curve is monotonic and capped", () => {
    let prev = -1;
    for (let i = 1; i <= 12; i++) { const d = circleDiscount(i); expect(d).toBeGreaterThanOrEqual(prev); expect(d).toBeLessThanOrEqual(DEFAULT_PRICING.circleMaxDiscount); prev = d; }
    expect(circleDiscount(1)).toBe(0);
  });
  it("total equals lines plus fees, minus promo", () => {
    const p = computePlan({ lines: [line("house-cleaning", 4), line("groceries", 1), line("decoration", 2)], promo: "WELCOME100" });
    expect(p.promoDiscount).toBe(10000);
    expect(planBalanced({ subtotal: p.subtotal, travelAmount: p.travel, platformFee: p.platformFee, coordinationFee: p.coordinationFee, minTopUp: p.minTopUp, promoDiscount: p.promoDiscount, total: p.total }, p.lines.reduce((s, l) => s + l.price, 0))).toBe(true);
  });
  it("shows a range around the total", () => { const [a, b] = priceRange(100000); expect(a).toBeLessThan(100000); expect(b).toBeGreaterThan(100000); });
});

describe("plan engine (keyword matching)", () => {
  it("understands the demo sentence", () => {
    const { lines } = draftFromText(DEMO_TEXT, CATALOG);
    const slugs = lines.map((l) => l.slug);
    expect(slugs).toEqual(expect.arrayContaining(["house-cleaning", "groceries", "wardrobe-organising", "decoration"]));
  });
  it("understands Hinglish and Hindi keywords", () => {
    expect(draftFromText("ghar saaf karwana hai aur bartan", CATALOG).lines.map((l) => l.slug)).toEqual(expect.arrayContaining(["house-cleaning", "utensils"]));
    expect(draftFromText("sabzi chahiye", CATALOG).lines[0].slug).toBe("groceries");
  });
  it("tolerates a typo", () => { expect(draftFromText("need cleaning and grocries", CATALOG).lines.map((l) => l.slug)).toContain("groceries"); });
  it("extracts quantities", () => { expect(draftFromText("clean my 2 bhk", CATALOG).lines[0].quantity).toBe(3); expect(draftFromText("decoration for 5 hours", CATALOG).lines[0].quantity).toBe(5); });
  it("blocks banned categories", () => {
    expect(detectBanned("book a massage")).toBe("massage");
    expect(detectBanned("do my homework")).toBe("homework");
    expect(draftFromText("need makeup artist", CATALOG).banned).toBeTruthy();
    expect(detectBanned("explain my physics concept")).toBeNull();
  });
  it("asks at most 3 questions and applies answers", () => {
    const { lines } = draftFromText(DEMO_TEXT, CATALOG);
    const qs = questionsFor(lines, CATALOG, DEMO_TEXT);
    expect(qs.length).toBeLessThanOrEqual(3);
    const out = applyAnswers(lines, { "house-cleaning:rooms": "6", "groceries:cap": "2500" }, CATALOG);
    expect(out.find((l) => l.slug === "house-cleaning")!.quantity).toBe(6);
    expect(out.find((l) => l.slug === "groceries")!.cap).toBe(250000);
  });
});

describe("leakage scanner", () => {
  it("flags phone numbers in many formats", () => {
    expect(scanMessage("call me on 9876543210").flags).toContain("phone");
    expect(scanMessage("my number is +91 98765 43210").flags).toContain("phone");
    expect(scanMessage("98765-43210").blurred).toBe(true);
  });
  it("flags spelled-out digits and Devanagari numerals", () => {
    expect(scanMessage("nine eight seven six five four three two one zero").flags).toContain("phone_spelled");
    expect(scanMessage("nau aath saat chhe paanch char teen do ek shunya").flags).toContain("phone_spelled");
    expect(scanMessage("९८७६५४३२१०").flags).toContain("phone");
  });
  it("flags UPI IDs, emails and handles", () => {
    expect(scanMessage("pay me at rahul@oksbi").flags).toContain("upi");
    expect(scanMessage("mail rahul@gmail.com").flags).toContain("email");
    expect(scanMessage("dm me @rahul_99").flags).toContain("social");
  });
  it("lets normal messages through", () => {
    const r = scanMessage("I will reach tower C at 10:30, floor 9, see you at 2 pm");
    expect(r.flags).toEqual([]); expect(r.blurred).toBe(false);
  });
});

describe("geo and ETA", () => {
  it("haversine and geofence", () => {
    const a = { lat: 28.5783, lng: 77.0421 };
    expect(haversine(a, a)).toBe(0);
    expect(withinGeofence(a, { lat: 28.5788, lng: 77.0421 })).toBe(true);
    expect(withinGeofence(a, { lat: 28.59, lng: 77.0421 })).toBe(false);
  });
  it("ETA grows with distance and floor", () => { expect(etaMinutes(2000, 10)).toBeGreaterThan(etaMinutes(200, 2)); });
  it("hex ids are stable and invertible-ish", () => {
    const id = hexId(28.5772, 77.0415, 8); expect(hexId(28.5772, 77.0415, 8)).toBe(id);
    const c = hexCenter(id); expect(Math.abs(c.lat - 28.5772)).toBeLessThan(0.01);
  });
});

describe("ledger and levels", () => {
  it("journals must balance to zero", () => {
    expect(journalBalanced([{ account: "a", debit: 100 }, { account: "b", credit: 100 }])).toBe(true);
    expect(journalBalanced([{ account: "a", debit: 100 }, { account: "b", credit: 90 }])).toBe(false);
  });
  it("levels follow job counts and rating", () => {
    expect(levelFor(5, 4.9)).toBe("STARTER"); expect(levelFor(20, 4.7)).toBe("TRUSTED"); expect(levelFor(20, 4.2)).toBe("STARTER");
    expect(levelFor(60, 4.8)).toBe("PRO"); expect(levelFor(130, 4.9)).toBe("ELITE");
  });
});
