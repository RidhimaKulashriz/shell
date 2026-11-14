"use client";
import { useEffect, useState } from "react";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
/** Registers the offline service worker and hides one small easter egg. */
export function Extras() {
  const [egg, setEgg] = useState(false);
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {}); }, []);
  useEffect(() => {
    let i = 0;
    const h = (e: KeyboardEvent) => { i = e.key === KONAMI[i] ? i + 1 : e.key === KONAMI[0] ? 1 : 0; if (i === KONAMI.length) { i = 0; setEgg(true); navigator.vibrate?.(80); setTimeout(() => setEgg(false), 4000); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);
  const [offline, setOffline] = useState(false);
  useEffect(() => { const on = () => setOffline(false), off = () => setOffline(true); setOffline(!navigator.onLine); window.addEventListener("online", on); window.addEventListener("offline", off); return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); }; }, []);
  return (
    <>
      {offline && <div role="status" className="fixed inset-x-0 top-0 z-[100] bg-sun px-4 py-2 text-center text-sm font-semibold text-tide">No network. We&apos;re saving your actions and will sync when you&apos;re back online.</div>}
      {egg && <div role="status" className="fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 rotate-[-2deg] bg-[#fff7c9] px-6 py-4 text-2xl text-[#3b3300] shadow-xl" style={{ fontFamily: "var(--font-hand)" }}>You found the hidden shell. Nobody&apos;s home, help yourself to the chai.</div>}
    </>
  );
}
