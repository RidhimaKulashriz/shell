"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { replayQueue } from "@/lib/offline";

const TABS = [["/app", "Home", "home"], ["/app/orders", "Orders", "bag"], ["/app/circle", "Circle", "queue"], ["/app/wallet", "Wallet", "wallet"], ["/app/me", "Me", "heart"]] as const;

export function OfflineBanner() {
  const [off, setOff] = useState(false);
  useEffect(() => {
    setOff(!navigator.onLine);
    const on = () => { setOff(false); replayQueue(); };
    const offf = () => setOff(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", offf);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", offf); };
  }, []);
  return off ? <div role="status" className="sticky top-0 z-50 bg-brick px-4 py-2 text-center text-sm font-semibold text-cream">You are offline. We are saving your actions and will sync them when you reconnect.</div> : null;
}

export function AppShell({ children, name }: { children: ReactNode; name: string }) {
  const path = usePathname();
  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-cream pb-24">
      <OfflineBanner />
      <div className="px-4 pt-4 md:px-6">{children}</div>
      <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/20 bg-paper">
        <ul className="mx-auto flex max-w-2xl">
          {TABS.map(([href, label, icon]) => {
            const on = href === "/app" ? path === "/app" : path.startsWith(href);
            return (
              <li key={href} className="flex-1">
                <Link href={href} aria-current={on ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-xs font-bold ${on ? "text-forest" : "text-ink/60"}`}>
                  <span className={`rounded-full px-4 py-0.5 ${on ? "bg-sand" : ""}`}><Icon name={icon} size={26} tone={on ? "sage" : "none"} /></span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <span className="sr-only">Signed in as {name}</span>
    </div>
  );
}
