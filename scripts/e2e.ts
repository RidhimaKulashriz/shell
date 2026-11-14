// Smoke test of the critical flow against a running server:
// request -> plan -> pay -> track -> complete -> rate. Run: npx tsx scripts/e2e.ts
const BASE = process.env.BASE ?? "http://localhost:3000";
let cookie = "";
async function call(path: string, body?: unknown) {
  const res = await fetch(BASE + path, { method: body === undefined ? "GET" : "POST", headers: { "content-type": "application/json", cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const sc = res.headers.get("set-cookie"); if (sc) cookie = sc.split(";")[0];
  const txt = await res.text(); let data: any = txt; try { data = JSON.parse(txt); } catch {}
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${txt.slice(0, 200)}`);
  return data;
}
const ok = (c: boolean, m: string) => { console.log(c ? "PASS" : "FAIL", m); if (!c) process.exitCode = 1; };
(async () => {
  await call("/api/auth/demo", { role: "customer" });
  const r = await call("/api/requests", { text: "Guests are coming tomorrow, need house cleaning, groceries and decoration" });
  ok(!!r.id, "request created: " + r.status);
  let planId: string | undefined;
  if (r.status === "clarifying") {
    for (let i = 0; i < 4; i++) { const d = await call(`/api/requests/${r.id}/answers`, { key: ["house-cleaning:rooms", "groceries:cap", "decoration:hours"][i], value: ["3", "2500", "2"][i] }); if (d.done) { planId = d.planId; break; } }
  } else planId = (await call(`/api/requests/${r.id}`)).planId;
  ok(!!planId, "plan built " + planId);
  const pay = await call(`/api/plans/${planId}/checkout`, { method: "upi", useCredits: true, useWallet: false, idempotencyKey: "e2e-" + Date.now() + "-key" });
  ok(pay.ok, "payment captured, charged " + pay.amount);
  const pay2 = await fetch(BASE + `/api/plans/${planId}/checkout`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ method: "upi", idempotencyKey: "e2e-second-try-key" }) });
  ok(pay2.status === 400, "second payment on same plan is refused");
  const html = await (await fetch(BASE + `/app/plans/${planId}`, { headers: { cookie } })).text();
  const ids = [...new Set([...html.matchAll(/\/app\/orders\/([0-9a-f-]{36})/g)].map((m) => m[1]))];
  ok(ids.length >= 3, "plan page lists tasks: " + ids.length);
  for (const id of ids) {
    for (let step = 0; step < 12; step++) { const res = await fetch(BASE + `/api/tasks/${id}/demo`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: "{}" }); if (!res.ok) break; }
    const page = await (await fetch(BASE + `/app/orders/${id}`, { headers: { cookie } })).text();
    ok(page.includes("Take a look"), "task ready for approval " + id.slice(0, 6));
    // groceries need expense approval first
    await fetch(BASE + `/api/tasks/${id}/expense_approve`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ rejected: [] }) });
    await call(`/api/tasks/${id}/approve`, {});
    const rv = await call(`/api/tasks/${id}/review`, { rating: 5, tags: ["On time"], tip: 20, shellNote: "Thank you!" });
    ok(rv.ok, "approved and reviewed " + id.slice(0, 6));
  }
  const ops = await (async () => { cookie = ""; await call("/api/auth/demo", { role: "ops" }); return await (await fetch(BASE + "/ops/finance", { headers: { cookie } })).text(); })();
  ok(ops.includes("every journal balances to zero"), "ledger balances after the flow");
  const wl = await fetch(BASE + "/api/waitlist/stats").then((r) => r.json()); ok(Array.isArray(wl.items), "public stats ok");
})().catch((e) => { console.error("ERROR", e.message); process.exit(1); });
