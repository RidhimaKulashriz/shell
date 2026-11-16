"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Menu, X, LogOut, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { LoginModal } from "./LoginModal";

type MeResponse = {
  user: { id: string; name: string; phone: string; role: string } | null;
};

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/safety", label: "Safety" },
  { href: "/contact", label: "Contact" },
];

function roleHome(role: string) {
  if (role === "HELPER") return "/earn/portal";
  if (role === "OPS" || role === "SUPER_ADMIN") return "/ops";
  if (role === "SOCIETY_PARTNER") return "/society";
  return "/app";
}

export function SiteHeader() {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: MeResponse) => setMe(j.user ?? null))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#E3E8E4] bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          {/* Left: Logo + nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#0B2B26]"
              aria-label="Shell home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0B2B26] text-base font-bold text-[#F2C318]">
                S
              </span>
              <span>Shell</span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-[10px] px-3 py-2 text-sm font-medium text-[#4B5A55] transition hover:bg-[#F7F8F6] hover:text-[#0E1A17]"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: Dwarka pill (hidden on small) */}
          <div className="hidden items-center gap-2 md:flex">
            <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#E3E8E4] bg-[#F7F8F6] px-3 py-1.5 text-xs font-semibold text-[#0B2B26]">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
              Dwarka Sectors 6 · 10 · 12 · Scheduled slots
            </span>
          </div>

          {/* Right: auth + cart */}
          <div className="flex items-center gap-2">
            {!loading && me ? (
              <>
                <Link
                  href={roleHome(me.role)}
                  className="hidden min-h-[44px] items-center gap-1.5 rounded-[10px] border border-[#E3E8E4] bg-white px-3 py-2 text-xs font-semibold text-[#0E1A17] hover:bg-[#F7F8F6] sm:inline-flex"
                >
                  <LayoutGrid className="h-4 w-4 text-[#0B2B26]" strokeWidth={1.75} />
                  {me.role === "HELPER" ? "Helper portal" : me.role === "OPS" || me.role === "SUPER_ADMIN" ? "Ops" : "My orders"}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border border-[#E3E8E4] bg-white px-3 py-2 text-xs font-semibold text-[#4B5A55] hover:bg-[#F7F8F6]"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] bg-[#0B2B26] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#163832]"
                >
                  <User className="h-4 w-4 text-[#F2C318]" strokeWidth={1.75} />
                  Login
                </button>
              </>
            )}

            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-[10px] border border-[#E3E8E4] bg-white lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="border-t border-[#E3E8E4] bg-white px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-[10px] px-3 py-3 text-sm font-semibold text-[#0E1A17] hover:bg-[#F7F8F6]"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-2 rounded-[10px] bg-[#F7F8F6] px-3 py-2 text-xs font-semibold text-[#0B2B26]">
                <MapPin className="h-4 w-4" strokeWidth={1.75} />
                Dwarka Sectors 6 · 10 · 12 · Scheduled slots
              </div>
            </nav>
          </div>
        )}
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
