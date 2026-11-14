import { describe, expect, it } from "vitest";
import { DEMO_SENTENCE, matchKeywords } from "@/lib/keywords";
import { scanMessage } from "@/lib/leakage";
import { DEFAULT_PRICING, circleDiscount, helperPayout, planTotalIsConsistent, quote, type TemplateLike } from "@/lib/pricing";
import { computeEta, etaStage, learn, shouldTriggerBackup } from "@/lib/eta";
import { assertBalanced, capture, isBalanced, payout, refund, release } from "@/lib/ledger";
import { canTransition, nextCircleStatus, payoutGuard, readinessPct, taskGuard, helperAgeOk } from "@/lib/statemachine";
import { haversine, latLngToHex, orderStops, pointInPolygon, impossibleSpeed } from "@/lib/geo";

const tpl = (slug: string, baseRate: number, over: Partial<TemplateLike> = {}): TemplateLike => ({ slug, name: slug, baseRate, unit: "job", minutesPerUnit: 60, sizeFactors: { small: 0.8, medium: 1, large: 1.4 }, ...over });

describe("keyword demo engine", () => {
  it("turns the demo Hinglish sentence into four tasks in order", () => {
    expect(matchKeywords(DEMO_SENTENCE).items.map((i) => i.slug)).toEqual(["clean-full-home", "groceries", "wardrobe-organise", "decoration"]);
  });
  it("handles bartan, hours and quantity", () => {
    expect(matchKeywords("bartan dhone hain").items.map((i) => i.slug)).toEqual(["utensils"]);
    const x = matchKeywords("excel sheet mein help chahiye 3 ghante");
    expect(x.items[0]).toMatchObject({ slug: "excel-help", qty: 3 });
  });
  it("reads Devanagari", () => {
    expect(matchKeywords("बर्तन और सफाई").items.map((i) => i.slug).sort()).toEqual(["clean-full-home", "utensils"]);
  });
  it("flags banned categories and returns nothing for unknown text", () => {
    const r = matchKeywords("massage chahiye");
    expect(r.items).toHaveLength(0);
    expect(r.banned).toContain("massage");
    expect(matchKeywords("xyzzy plugh").items).toHaveLength(0);
    expect(matchKeywords("meri homework kar do").banned.length).toBe(1);
  });
  it("prefers a specific room over a generic clean", () => {
    expect(matchKeywords("kitchen saaf karwana hai").items.map((i) => i.slug)).toEqual(["clean-kitchen"]);
  });
});

describe("leakage scanner", () => {
  it("catches digits, spaced digits, spelled out and devanagari numerals", () => {
    expect(scanMessage("call me on 9876543210").flags).toContain("phone");
    expect(scanMessage("98765 43210 pe baat karo").flags).toContain("phone");
    expect(scanMessage("nine eight seven six five four three two one zero").flags).toContain("phone");
    expect(scanMessage("mera number nau aath saat chhe paanch char teen do ek shunya").flags).toContain("phone");
    expect(scanMessage("९८७६५४३२१०").flags).toContain("phone");
    expect(scanMessage("double nine eight seven six five four three two").flags).toContain("phone");
  });
  it("catches upi, email and social handles", () => {
    expect(scanMessage("pay rahul@okaxis").flags).toContain("upi");
    expect(scanMessage("mail a.b@gmail.com").flags).toContain("email");
    expect(scanMessage("dm @rahul_k please").flags).toContain("social");
    expect(scanMessage("pay me direct cash").flags).toContain("offplatform_payment");
  });
  it("does not flag normal chat", () => {
    for (const s of ["ek do teen minute mein aata hoon", "Tower C 9th floor, 3 bedrooms", "total 1500 rupees", "lift lobby 2 se aao"]) expect(scanMessage(s).hit).toBe(false);
  });
  it("redacts what it finds", () => {
    expect(scanMessage("call 9876543210 now").redacted).not.toMatch(/9876543210/);
  });
});

describe("pricing engine", () => {
  it("applies minimum order value and shows the top-up", () => {
    const q = quote({ lines: [{ template: tpl("utensils", 14900), qty: 1, size: "medium" }] });
    expect(q.total).toBe(DEFAULT_PRICING.minOrder);
    expect(q.minOrderTopUp).toBe(DEFAULT_PRICING.minOrder - (14900 + DEFAULT_PRICING.feeFloor));
  });
  it("uses the larger of fee floor and percent", () => {
    const q = quote({ lines: [{ template: tpl("a", 100000), qty: 1, size: "medium" }] });
    expect(q.platformFee).toBe(6000);
    expect(quote({ lines: [{ template: tpl("a", 20000), qty: 1, size: "medium" }] }).platformFee).toBe(2900);
  });
  it("adds coordination fee at 3+ tasks or Managed", () => {
    const three = quote({ lines: ["a", "b", "c"].map((s) => ({ template: tpl(s, 30000), qty: 1, size: "medium" as const })) });
    expect(three.coordinationFee).toBe(DEFAULT_PRICING.coordinationFee);
    expect(quote({ lines: [{ template: tpl("a", 30000), qty: 1, size: "medium" }] }).coordinationFee).toBe(0);
    expect(quote({ managed: true, lines: [{ template: tpl("a", 30000), qty: 1, size: "medium" }] }).coordinationFee).toBe(DEFAULT_PRICING.coordinationFee);
  });
  it("applies urgency multipliers and size factors", () => {
    const base = quote({ lines: [{ template: tpl("a", 100000), qty: 2, size: "large" }] });
    expect(base.subtotal).toBe(280000);
    expect(quote({ urgency: "rush", lines: [{ template: tpl("a", 100000), qty: 1, size: "medium" }] }).adjustedSubtotal).toBe(150000);
    expect(quote({ urgency: "same_day", lines: [{ template: tpl("a", 100000), qty: 1, size: "medium" }] }).urgencyMultiplier).toBe(1.2);
  });
  it("Circle curve has a floor/ceiling and lowers the price", () => {
    expect(circleDiscount(1)).toBe(0);
    expect(circleDiscount(4)).toBe(0.15);
    expect(circleDiscount(50)).toBe(0.2);
    const solo = quote({ lines: [{ template: tpl("a", 100000), qty: 1, size: "medium" }] });
    const circle = quote({ circleJoiners: 6, lines: [{ template: tpl("a", 100000), qty: 1, size: "medium" }] });
    expect(circle.total).toBeLessThan(solo.total);
  });
  it("keeps plan totals consistent and computes helper payout", () => {
    const q = quote({ urgency: "same_day", circleJoiners: 3, travelPaise: 2000, lines: [{ template: tpl("a", 80000), qty: 2, size: "medium" }] });
    expect(planTotalIsConsistent({ subtotal: q.subtotal, urgencyMultiplier: q.urgencyMultiplier, circleDiscount: q.circleDiscount, travelAmount: q.travel, platformFee: q.platformFee, coordinationFee: q.coordinationFee, total: q.total })).toBe(true);
    expect(planTotalIsConsistent({ subtotal: 1000, urgencyMultiplier: 1, circleDiscount: 0, travelAmount: 0, platformFee: 0, coordinationFee: 0, total: 5 })).toBe(false);
    expect(helperPayout(10000, "PRO")).toBe(7800);
  });
});

describe("eta", () => {
  it("sums the parts and learns", () => {
    const e = computeEta({ travelMin: 3, gateWaitMin: 2, walkMin: 2, floor: 9 });
    expect(e.total).toBe(Math.ceil(e.travel + e.gate + e.walk + e.lift + e.buffer));
    expect(e.lift).toBeGreaterThan(1);
    const l = learn({ gateWaitMin: 2, liftPerFloorSec: 4, samples: 10 }, { gateWaitMin: 6 });
    expect(l.gateWaitMin).toBeGreaterThan(2);
    expect(l.samples).toBe(11);
    expect(etaStage(14)).toBe("t15");
    expect(etaStage(4)).toBe("t5");
    expect(etaStage(30)).toBe("far");
    expect(etaStage(30, true)).toBe("arrived");
    expect(shouldTriggerBackup(12)).toBe(true);
    expect(shouldTriggerBackup(3)).toBe(false);
  });
});

describe("ledger", () => {
  it("balances every journal", () => {
    expect(isBalanced(capture(100000))).toBe(true);
    expect(isBalanced(capture(100000, 5000))).toBe(true);
    expect(isBalanced(release(50000, 38000))).toBe(true);
    expect(isBalanced(refund(2000))).toBe(true);
    expect(isBalanced(payout(38000, 380))).toBe(true);
    expect(() => assertBalanced([{ account: "escrow", debit: 10, credit: 0, memo: "" }])).toThrow();
  });
});

describe("state machines & guards", () => {
  it("enforces the task flow and constraints", () => {
    expect(canTransition("task", "planned", "offered")).toBe(true);
    expect(canTransition("task", "planned", "approved")).toBe(false);
    expect(taskGuard("arrived", "in_progress", {})).toMatch(/check-in/);
    expect(taskGuard("arrived", "in_progress", { otpOk: true, checkinAt: new Date() })).toBeNull();
    expect(taskGuard("en_route", "arrived", {})).toMatch(/geofence/);
    expect(taskGuard("awaiting_approval", "rework", { reworkCount: 1 })).toMatch(/once/);
    expect(taskGuard("awaiting_approval", "rework", { reworkCount: 0 })).toBeNull();
    expect(payoutGuard({ status: "in_progress" })).toMatch(/approved/);
    expect(payoutGuard({ status: "approved" })).toBeNull();
    expect(payoutGuard({ status: "awaiting_approval", autoApproveAt: new Date(Date.now() - 1000) })).toBeNull();
  });
  it("enforces helper age, circle status and readiness", () => {
    expect(helperAgeOk(new Date("2000-01-01"))).toBe(true);
    expect(helperAgeOk(new Date(Date.now() - 17 * 365 * 86400000))).toBe(false);
    const future = new Date(Date.now() + 3600000);
    expect(nextCircleStatus({ current: 4, min: 3, max: 6, cutoffAt: future, status: "open" })).toBe("confirmed");
    expect(nextCircleStatus({ current: 2, min: 3, max: 6, cutoffAt: future, status: "open" })).toBe("filling");
    expect(nextCircleStatus({ current: 2, min: 3, max: 6, cutoffAt: new Date(Date.now() - 1000), status: "filling" })).toBe("cancelled");
    expect(nextCircleStatus({ current: 6, min: 3, max: 6, cutoffAt: future, status: "confirmed" })).toBe("full");
    expect(readinessPct(["approved", "approved"])).toBe(100);
    expect(readinessPct(["approved", "planned"])).toBe(50);
  });
});

describe("geo", () => {
  it("measures, indexes and orders", () => {
    expect(Math.round(haversine({ lat: 28.6, lng: 77.2 }, { lat: 28.61, lng: 77.2 }))).toBeGreaterThan(1000);
    expect(latLngToHex(28.5921, 77.046, 9)).toBe(latLngToHex(28.59211, 77.04601, 9));
    expect(latLngToHex(28.5921, 77.046, 8)).not.toBe(latLngToHex(28.62, 77.1, 8));
    expect(pointInPolygon({ lat: 1, lng: 1 }, [[0, 0], [0, 2], [2, 2], [2, 0]])).toBe(true);
    expect(pointInPolygon({ lat: 3, lng: 1 }, [[0, 0], [0, 2], [2, 2], [2, 0]])).toBe(false);
    const ordered = orderStops({ lat: 0, lng: 0 }, [{ lat: 0, lng: 0.03 }, { lat: 0, lng: 0.01 }, { lat: 0, lng: 0.02 }]);
    expect(ordered.map((p) => p.lng)).toEqual([0.01, 0.02, 0.03]);
    expect(impossibleSpeed({ lat: 28.59, lng: 77.04, ts: 0 }, { lat: 28.69, lng: 77.04, ts: 60000 })).toBe(true);
  });
});
