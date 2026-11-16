import crypto from "node:crypto";
import { expect, request as pwRequest, test, type APIRequestContext } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const doorOtp = (id: string) => String(parseInt(crypto.createHmac("sha256", process.env.APP_SECRET ?? "shell-dev-secret-change-me").update("door:" + id).digest("hex").slice(0, 8), 16) % 10000).padStart(4, "0");

async function login(phone: string, role = "CUSTOMER"): Promise<APIRequestContext> {
  const ctx = await pwRequest.newContext({ baseURL: BASE });
  role = role === "HELPER" ? "HELPER" : "CUSTOMER"; // existing staff accounts keep their stored role
  const r = await ctx.post("/api/auth/request", { data: { phone, role } });
  expect(r.ok()).toBeTruthy();
  const v = await ctx.post("/api/auth/verify", { data: { phone, code: "123456", role } });
  expect(v.ok(), await v.text()).toBeTruthy();
  return ctx;
}

test("waitlist signup is OTP verified, one per number", async () => {
  const ctx = await pwRequest.newContext({ baseURL: BASE });
  const phone = "9" + String(Math.floor(100000000 + Math.random() * 899999999));
  expect((await ctx.post("/api/waitlist/otp", { data: { phone } })).ok()).toBeTruthy();
  const bad = await ctx.post("/api/waitlist", { data: { name: "Test Neighbour", phone, otp: "000000", role: "help", society: "Green Meadows Apartments", consent: true } });
  expect(bad.status()).toBe(400);
  const ok = await ctx.post("/api/waitlist", { data: { name: "Test Neighbour", phone, otp: "123456", role: "help", society: "Green Meadows Apartments", consent: true } });
  expect(ok.ok(), await ok.text()).toBeTruthy();
  const j = await ok.json();
  expect(j.position).toBeGreaterThan(0);
  const again = await (await ctx.post("/api/waitlist", { data: { name: "Test Neighbour", phone, otp: "123456", role: "help", society: "", consent: true } })).json();
  expect(again.existing).toBe(true);
});

test("request -> plan -> pay -> track -> complete -> rate", async () => {
  const customer = await login("9999900001");
  const ops = await login("9999900002", "OPS");
  const rahul = await login("9100000001", "HELPER");

  // request (text), plan engine drafts, clarifying questions answered
  const req = await (await customer.post("/api/requests", { data: { text: "Kal ghar ka ek kamra saaf karwana hai" } })).json();
  expect(req.id).toBeTruthy();
  const got = await (await customer.get(`/api/requests/${req.id}`)).json();
  for (const q of got.request.questions) await customer.post(`/api/requests/${req.id}`, { data: { questionId: q.id, answer: q.chips[0] } });

  // ops builds and sends the plan (humans approve every plan in v1)
  const plan = await (await ops.post("/api/ops/plans", { data: { requestId: req.id, title: "E2E clean", items: [{ template: "clean-room", qty: 1, size: "medium" }] } })).json();
  expect(plan.total).toBeGreaterThanOrEqual(19900);
  expect((await ops.post(`/api/ops/plans/${plan.planId}/send`, { data: {} })).ok()).toBeTruthy();

  // pay: idempotent order, signature verified
  const key = "e2e-" + Date.now();
  const o1 = await (await customer.post("/api/checkout/orders", { data: { planId: plan.planId, useCredits: false, idempotencyKey: key } })).json();
  const o2 = await (await customer.post("/api/checkout/orders", { data: { planId: plan.planId, useCredits: false, idempotencyKey: key } })).json();
  expect(o2.orderId).toBe(o1.orderId);
  const bad = await customer.post("/api/checkout/verify", { data: { orderId: o1.orderId, paymentId: "pay_x", signature: "nope" } });
  expect(bad.status()).toBe(400);
  expect((await customer.post("/api/checkout/verify", { data: { orderId: o1.orderId, mock: true } })).ok()).toBeTruthy();

  // dispatch: ops assigns Rahul with a reason
  const { plan: p, tasks } = await (await customer.get(`/api/plans/${plan.planId}`)).json();
  expect(p.status).toBe("approved");
  const taskId: string = tasks[0].id;
  const sugg = await (await ops.get(`/api/ops/suggest/${taskId}`)).json();
  const rahulId = sugg.suggestions.find((s: { name: string }) => s.name === "Rahul Verma")?.helperId;
  expect(rahulId).toBeTruthy();
  expect((await ops.post(`/api/ops/tasks/${taskId}/assign`, { data: { helperId: rahulId, reason: "e2e" } })).ok()).toBeTruthy();

  // helper: en route, geofenced check-in with OTP (far fails, wrong OTP fails, right passes)
  expect((await rahul.post(`/api/tasks/${taskId}/enroute`, { data: {} })).ok()).toBeTruthy();
  const far = await rahul.post(`/api/tasks/${taskId}/checkin`, { data: { lat: 28.7, lng: 77.2, otp: doorOtp(taskId) } });
  expect(far.status()).toBe(403);
  const wrong = await rahul.post(`/api/tasks/${taskId}/checkin`, { data: { lat: 28.5927, lng: 77.0467, otp: doorOtp(taskId) === "0000" ? "1111" : "0000" } });
  expect(wrong.status()).toBe(400);
  const ok = await rahul.post(`/api/tasks/${taskId}/checkin`, { data: { lat: 28.5927, lng: 77.0467, otp: doorOtp(taskId) } });
  expect(ok.ok(), await ok.text()).toBeTruthy();
  for (let i = 0; i < tasks[0].checklist.length; i++) await rahul.post(`/api/tasks/${taskId}/checklist`, { data: { index: i, done: true } });
  expect((await rahul.post(`/api/tasks/${taskId}/checkout`, { data: {} })).ok()).toBeTruthy();

  // customer approves, funds release, rates and tips
  expect((await customer.post(`/api/tasks/${taskId}/approve`, { data: {} })).ok()).toBeTruthy();
  const review = await customer.post(`/api/tasks/${taskId}/review`, { data: { rating: 5, tags: ["on time"], tip: 2000, shellNote: "Thank you!" } });
  expect(review.ok(), await review.text()).toBeTruthy();
});

test("chat scanner blurs phone numbers and UPI IDs", async () => {
  const customer = await login("9999900001");
  const r = await (await customer.post(`/api/threads/${encodeURIComponent("support:" + (await (await customer.get("/api/me")).json()).user.id)}/messages`, { data: { body: "call me on 9876543210 or pay rahul@okaxis" } })).json();
  expect(r.message.blurred).toBe(true);
  expect(r.message.body).not.toContain("9876543210");
  expect(r.warning).toBeTruthy();
});
