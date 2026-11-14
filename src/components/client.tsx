"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "./ui";

export async function post<T = any>(url: string, body: unknown = {}, method = "POST"): Promise<T> {
  const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: method === "GET" ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? "Something went wrong. Please try again.");
  return data as T;
}

export function useToast() {
  const [t, setT] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const node = t ? <Toast msg={t.msg} kind={t.kind} onDone={() => setT(null)} /> : null;
  const show = useCallback((msg: string, kind: "ok" | "err" = "ok") => setT({ msg, kind }), []);
  return { show, node };
}

/** One-tap action button: posts, shows a toast, refreshes the page. */
export function ActionButton({ url, body, children, className = "btn btn-primary", confirm, success, onDone, method = "POST", disabled }: {
  url: string; body?: unknown; children: React.ReactNode; className?: string; confirm?: string; success?: string; onDone?: (d: any) => void; method?: string; disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { show, node } = useToast();
  return (
    <>
      <button className={className} disabled={busy || disabled} onClick={async () => {
        if (confirm && !window.confirm(confirm)) return;
        setBusy(true);
        try { const d = await post(url, body ?? {}, method); if (success) show(success); onDone?.(d); router.refresh(); } catch (e) { show((e as Error).message, "err"); } finally { setBusy(false); }
      }}>{busy ? "Please wait…" : children}</button>
      {node}
    </>
  );
}

export async function compressImage(file: File, max = 900, quality = 0.7): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", quality);
}

export function Poll({ every = 5000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => { const i = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, every); return () => clearInterval(i); }, [every, router]);
  return null;
}
