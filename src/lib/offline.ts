"use client";
// Offline queue: failed writes are stored and replayed when the network returns ("Network nahi hai. Hum aapke actions save kar rahe hain.").
const KEY = "shell_queue_v1";
type Q = { url: string; method: string; body: unknown; ts: number };
const read = (): Q[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };
const write = (q: Q[]) => localStorage.setItem(KEY, JSON.stringify(q.slice(-50)));

export async function send(url: string, body: unknown, method = "POST"): Promise<{ ok: boolean; queued?: boolean; data?: any; error?: string }> {
  try {
    const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, data } : { ok: false, data, error: data?.error?.message ?? "Kuch gadbad ho gayi" };
  } catch {
    write([...read(), { url, method, body, ts: Date.now() }]);
    return { ok: true, queued: true };
  }
}

export async function replayQueue() {
  const q = read();
  if (!q.length) return 0;
  write([]);
  let done = 0;
  for (const item of q) {
    try {
      const r = await fetch(item.url, { method: item.method, headers: { "content-type": "application/json" }, body: JSON.stringify(item.body) });
      if (r.ok || r.status < 500) done++;
      else write([...read(), item]);
    } catch {
      write([...read(), item]);
    }
  }
  return done;
}
