"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Search,
  ShoppingCart,
  Clock,
  Star,
  Plus,
  Minus,
  X,
  CheckCircle2,
  ShieldCheck,
  Navigation,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  PackageCheck,
  ChevronDown,
  LayoutGrid,
  ShoppingBag,
  Sparkles,
  Utensils,
  ShoppingBasket,
  Package,
  FolderKanban,
  PartyPopper,
  Users,
  FileSpreadsheet,
  BookOpen,
  Dog,
  Truck,
  Wrench,
  Trophy,
  Milk,
  Wheat,
  Egg,
  Apple,
  Coffee,
  Droplets,
  Home as HomeIcon,
  User,
  KeyRound,
  Tag,
} from "lucide-react";
import { LiveMap, type MapMarker } from "@/components/LiveMap";
import {
  CATEGORIES,
  LOCATION_PRESETS,
  SERVICE_PACKS,
  STORE_ITEMS,
  type CatalogItem,
  type CategoryId,
  type LocationPreset,
} from "@/lib/store-catalog";

type PaymentMethod = "upi" | "wallet" | "card" | "cash_after";

interface OrderRecord {
  id: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paymentMethod: PaymentMethod;
  locationName: string;
  slot: string;
  doorOtp: string;
  coords: [number, number];
  etaMins: number;
  helperName: string;
  helperRating: number;
  status: "confirmed" | "assigned" | "en_route";
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  LayoutGrid,
  ShoppingBag,
  Sparkles,
  Utensils,
  ShoppingBasket,
  Package,
  FolderKanban,
  PartyPopper,
  Users,
  FileSpreadsheet,
  BookOpen,
  Dog,
  Truck,
  Wrench,
  Clock,
  Trophy,
  Milk,
  Wheat,
  Egg,
  Apple,
  Coffee,
  Droplets,
};

function RenderIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const IconComp = ICON_MAP[name] ?? Sparkles;
  return <IconComp className={className} strokeWidth={1.75} />;
}

export function ShellStorefront() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Record<string, { name: string; price: number; unit: string; qty: number }>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  const [activeLocation, setActiveLocation] = useState<LocationPreset>(LOCATION_PRESETS[0]);
  const [customCoords, setCustomCoords] = useState<[number, number]>([
    LOCATION_PRESETS[0].lat,
    LOCATION_PRESETS[0].lng,
  ]);
  const [customLabel, setCustomLabel] = useState<string>(LOCATION_PRESETS[0].name);

  // 3-step checkout state
  const [selectedSlot, setSelectedSlot] = useState("Today, 4:00 PM - 5:00 PM");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [isPaying, setIsPaying] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [requestText, setRequestText] = useState(
    "Guests arriving tomorrow, need 2BHK deep clean, groceries, and party decoration"
  );
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return STORE_ITEMS.filter((item) => {
      const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const goodsList = useMemo(() => filteredItems.filter((i) => i.kind === "good"), [filteredItems]);
  const servicesList = useMemo(() => filteredItems.filter((i) => i.kind === "service"), [filteredItems]);

  const cartEntries = useMemo(() => Object.entries(cart).filter(([, v]) => v.qty > 0), [cart]);
  const cartCount = useMemo(() => cartEntries.reduce((sum, [, v]) => sum + v.qty, 0), [cartEntries]);
  const itemSubtotal = useMemo(() => cartEntries.reduce((sum, [, v]) => sum + v.price * v.qty, 0), [cartEntries]);
  const platformFee = itemSubtotal > 0 ? Math.max(19, Math.round(itemSubtotal * 0.04)) : 0;
  const discount = appliedCoupon ? Math.min(appliedCoupon.discount, itemSubtotal) : 0;
  const grandTotal = Math.max(0, itemSubtotal - discount + platformFee);

  const updateItemQty = (id: string, name: string, price: number, unit: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id]?.qty ?? 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: { name, price, unit, qty: next } };
    });
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    setCouponError("");
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: itemSubtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "Invalid or expired coupon code.");
        return;
      }
      setAppliedCoupon({ code: data.code ?? code, discount: Number(data.discount ?? 0) });
    } catch {
      setCouponError("Unable to validate coupon right now. Please try again.");
    }
  };

  const handleSelectPreset = (preset: LocationPreset) => {
    setActiveLocation(preset);
    setCustomCoords([preset.lat, preset.lng]);
    setCustomLabel(preset.name);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setCustomCoords([lat, lng]);
    setCustomLabel(`Pinned (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  };

  const mapMarkers: MapMarker[] = useMemo(() => {
    const [lat, lng] = customCoords;
    return [
      {
        id: "user-pin",
        lat,
        lng,
        title: customLabel,
        subtitle: `Service available · ${activeLocation.etaMins} mins ETA`,
        type: "user",
      },
      {
        id: "hub-1",
        lat: lat + 0.0055,
        lng: lng - 0.0045,
        title: "Dwarka Sector 12 Hub",
        subtitle: "Groceries & essentials dispatch",
        type: "hub",
      },
      {
        id: "helper-1",
        lat: lat - 0.0032,
        lng: lng + 0.0041,
        title: "Isha Kapoor (Verified Helper)",
        subtitle: "4.94 rating · Home Cleaning · 4 mins away",
        type: "helper",
      },
      {
        id: "helper-2",
        lat: lat + 0.0028,
        lng: lng + 0.0062,
        title: "Rajesh Kumar (Verified Helper)",
        subtitle: "4.91 rating · Small Repairs · 6 mins away",
        type: "helper",
      },
    ];
  }, [customCoords, customLabel, activeLocation.etaMins]);

  const handlePlaceOrder = () => {
    if (cartEntries.length === 0) return;
    setIsPaying(true);

    setTimeout(() => {
      const newOrder: OrderRecord = {
        id: `SHL-${Math.floor(100000 + Math.random() * 900000)}`,
        items: cartEntries.map(([, v]) => ({ name: v.name, qty: v.qty, price: v.price })),
        total: grandTotal,
        paymentMethod,
        locationName: customLabel,
        slot: selectedSlot,
        doorOtp: String(Math.floor(1000 + Math.random() * 9000)),
        coords: customCoords,
        etaMins: activeLocation.etaMins,
        helperName: "Isha Kapoor",
        helperRating: 4.94,
        status: "en_route",
      };

      setOrders((prev) => [newOrder, ...prev]);
      setActiveOrder(newOrder);
      setCart({});
      setAppliedCoupon(null);
      setCouponCode("");
      setIsPaying(false);
      setIsCartOpen(false);
      setIsOrdersOpen(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#0E1A17]">
      {/* STICKY HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#E3E8E4] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-[#0B2B26]">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0B2B26] text-base font-bold text-[#F2C318]">
                S
              </span>
              <span>Shell</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex min-h-[44px] items-center gap-2 rounded-[10px] border border-[#E3E8E4] bg-[#F7F8F6] px-3 py-1.5 text-left transition hover:border-[#0B2B26]"
            >
              <MapPin className="h-4 w-4 shrink-0 text-[#0B2B26]" strokeWidth={1.75} />
              <div className="leading-tight">
                <div className="flex items-center gap-1 text-xs font-semibold text-[#0E1A17]">
                  <span>Dwarka Pilot · Scheduled slots</span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#4B5A55]" strokeWidth={1.75} />
                </div>
                <div className="max-w-[160px] truncate text-[11px] text-[#4B5A55] sm:max-w-[220px]">
                  {customLabel}
                </div>
              </div>
            </button>
          </div>

          <div className="order-3 w-full md:order-2 md:max-w-md md:flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8A85]" strokeWidth={1.75} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search services and groceries"
                placeholder="Search cleaning, groceries, repairs, errands..."
                className="min-h-[44px] w-full rounded-[10px] border border-[#E3E8E4] bg-[#F7F8F6] py-2 pl-10 pr-4 text-sm text-[#0E1A17] placeholder:text-[#7C8A85] focus:border-[#0B2B26] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="order-2 flex items-center gap-2 md:order-3">
            <a
              href="#live-map"
              className="hidden min-h-[44px] items-center gap-1.5 rounded-[10px] border border-[#E3E8E4] bg-white px-3 py-2 text-xs font-semibold text-[#0E1A17] transition hover:bg-[#EEF6F0] sm:inline-flex"
            >
              <Navigation className="h-4 w-4 text-[#0B2B26]" strokeWidth={1.75} />
              Explore map
            </a>

            <button
              type="button"
              onClick={() => setIsOrdersOpen(true)}
              className="relative inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border border-[#E3E8E4] bg-white px-3 py-2 text-xs font-semibold text-[#0E1A17] transition hover:bg-[#EEF6F0]"
            >
              <PackageCheck className="h-4 w-4 text-[#0B2B26]" strokeWidth={1.75} />
              <span className="hidden sm:inline">Orders</span>
              {orders.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1E8E5A] px-1 text-[10px] font-bold text-white">
                  {orders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] bg-[#0B2B26] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163832]"
            >
              <ShoppingCart className="h-4 w-4 text-[#F2C318]" strokeWidth={1.75} />
              {cartCount > 0 ? (
                <span>
                  {cartCount} · Rs {grandTotal}
                </span>
              ) : (
                <span>Cart</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO STRIP: Managed Coordinator ("Tell Shell what you need") */}
      <section className="border-b border-[#E3E8E4] bg-[#EEF6F0]">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-6 px-4 py-8 md:flex-row md:items-center md:px-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-[6px] bg-white px-2.5 py-1 text-xs font-semibold text-[#0B2B26]">
              <span>Dwarka Sector 12 Pilot · Human-reviewed plans</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#0E1A17] sm:text-3xl md:text-4xl">
              Get comfortable. We&apos;ve got it.
            </h1>
            <p className="mt-2 text-sm text-[#4B5A55] sm:text-base">
              Tell Shell what you need done. Our team reviews every plan, assigns
              verified helpers in your society, and stays until the job is done.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="#catalog"
                className="inline-flex min-h-[44px] items-center rounded-[10px] bg-[#0B2B26] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163832]"
              >
                Tell Shell what you need
              </a>
              <a
                href="#packs"
                className="inline-flex min-h-[44px] items-center rounded-[10px] border border-[#E3E8E4] bg-white px-5 py-2.5 text-sm font-semibold text-[#0E1A17] transition hover:bg-[#F7F8F6]"
              >
                Browse quick tasks &amp; packs
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-2">
            {[
              { label: "ID-verified helpers", icon: ShieldCheck },
              { label: "Door OTP check-in", icon: KeyRound },
              { label: "24h free rework", icon: CheckCircle2 },
              { label: "Pay after approval", icon: Wallet },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-[12px] border border-[#E3E8E4] bg-white px-3.5 py-3 text-xs font-semibold text-[#0E1A17]"
                >
                  <IconComp className="h-4 w-4 shrink-0 text-[#1E8E5A]" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TELL SHELL REQUEST COMPOSER (Managed Coordinator) */}
      <section id="tell-shell" className="mx-auto max-w-[1200px] px-4 pt-8 md:px-6">
        <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-5 md:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#0E1A17]">
                Tell Shell what you need
              </h2>
              <p className="text-xs text-[#4B5A55]">
                Describe your outcome in plain English. In v1, our ops team reviews every plan before confirming.
              </p>
            </div>
            <span className="inline-block rounded-[6px] bg-[#EEF6F0] px-2.5 py-1 text-[11px] font-semibold text-[#0B2B26]">
              Illustrative plan preview
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <div>
              <textarea
                rows={3}
                value={requestText}
                onChange={(e) => {
                  setRequestText(e.target.value);
                  setRequestSubmitted(false);
                }}
                placeholder="e.g. Guests arriving tomorrow, need bathroom cleaning, groceries, and parcel pickup..."
                className="w-full rounded-[10px] border border-[#E3E8E4] bg-[#F7F8F6] p-3 text-sm text-[#0E1A17] focus:border-[#0B2B26] focus:bg-white focus:outline-none"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[#7C8A85]">
                  Dwarka Sector 12 Pilot · Human-reviewed within 15 mins
                </span>
                <button
                  type="button"
                  onClick={() => setRequestSubmitted(true)}
                  className="min-h-[44px] rounded-[10px] bg-[#0B2B26] px-5 py-2 text-xs font-semibold text-white hover:bg-[#163832]"
                >
                  {requestSubmitted ? "Sent to Ops Team" : "Submit for Ops Review"}
                </button>
              </div>
              {requestSubmitted && (
                <div className="mt-3 rounded-[10px] bg-[#EEF6F0] p-3 text-xs font-semibold text-[#1E8E5A]">
                  Request received. A Shell coordinator will review and send your confirmed plan shortly.
                </div>
              )}
            </div>

            <div className="rounded-[12px] border border-[#E3E8E4] bg-[#F7F8F6] p-4 text-xs">
              <div className="font-mono font-semibold uppercase tracking-wider text-[#4B5A55]">
                Sample Reviewed Plan
              </div>
              <div className="mt-2 space-y-1.5 text-[#0E1A17]">
                <div className="flex justify-between">
                  <span>Full Home Deep Cleaning (2BHK)</span>
                  <span className="font-mono">Rs 1,499</span>
                </div>
                <div className="flex justify-between">
                  <span>Groceries &amp; Daily Essentials</span>
                  <span className="font-mono">Rs 350</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform &amp; Coordination Fee</span>
                  <span className="font-mono">Rs 74</span>
                </div>
                <div className="flex justify-between border-t border-[#E3E8E4] pt-2 font-bold">
                  <span>Estimated Total</span>
                  <span className="font-mono">Rs 1,923</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY GRID (15 Services + Groceries) */}
      <section id="catalog" className="mx-auto max-w-[1200px] px-4 pt-8 md:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0E1A17] sm:text-xl">
            Browse by category
          </h2>
          {selectedCategory !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="text-xs font-semibold text-[#0B2B26] underline"
            >
              Show all
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-[10px] border px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-[#0B2B26] bg-[#0B2B26] text-white"
                    : "border-[#E3E8E4] bg-white text-[#4B5A55] hover:border-[#0B2B26] hover:text-[#0E1A17]"
                }`}
              >
                <RenderIcon name={cat.iconName} className="h-4 w-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SERVICES LISTING */}
      {servicesList.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-4 pt-8 md:px-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#0E1A17] sm:text-xl">
              Home services &amp; errands
            </h2>
            <p className="text-xs text-[#4B5A55] sm:text-sm">
              Transparent INR pricing · Verified helpers in Dwarka
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servicesList.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                qty={cart[item.id]?.qty ?? 0}
                onAdd={() => updateItemQty(item.id, item.name, item.price, item.unit, 1)}
                onRemove={() => updateItemQty(item.id, item.name, item.price, item.unit, -1)}
              />
            ))}
          </div>
        </section>
      )}

      {/* GROCERIES LISTING */}
      {goodsList.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-4 pt-10 md:px-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#0E1A17] sm:text-xl">
              Groceries &amp; daily essentials
            </h2>
            <p className="text-xs text-[#4B5A55] sm:text-sm">
              Delivered from your nearest Dwarka store
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {goodsList.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                qty={cart[item.id]?.qty ?? 0}
                onAdd={() => updateItemQty(item.id, item.name, item.price, item.unit, 1)}
                onRemove={() => updateItemQty(item.id, item.name, item.price, item.unit, -1)}
              />
            ))}
          </div>
        </section>
      )}

      {/* PACKS CAROUSEL */}
      <section id="packs" className="mx-auto max-w-[1200px] px-4 pt-10 md:px-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#0E1A17] sm:text-xl">
            Service packs (bundle &amp; save)
          </h2>
          <p className="text-xs text-[#4B5A55] sm:text-sm">
            Common combinations booked together at a bundle price
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_PACKS.map((pack) => {
            const qty = cart[pack.id]?.qty ?? 0;
            return (
              <div
                key={pack.id}
                className="flex flex-col justify-between rounded-[12px] border border-[#E3E8E4] bg-white p-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-[6px] bg-[#EEF6F0] px-2 py-0.5 text-[11px] font-semibold text-[#0B2B26]">
                      {pack.duration}
                    </span>
                    <span className="text-xs font-semibold text-[#1E8E5A]">
                      Save Rs {pack.originalPrice - pack.packPrice}
                    </span>
                  </div>
                  <h3 className="mt-2.5 text-base font-bold text-[#0E1A17]">
                    {pack.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#4B5A55]">{pack.description}</p>
                  <ul className="mt-3 space-y-1 text-xs text-[#4B5A55]">
                    {pack.services.map((s) => (
                      <li key={s} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#1E8E5A]" strokeWidth={1.75} />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#E3E8E4] pt-3">
                  <div>
                    <span className="text-base font-bold text-[#0E1A17]">
                      Rs {pack.packPrice}
                    </span>
                    <span className="ml-1.5 text-xs text-[#7C8A85] line-through">
                      Rs {pack.originalPrice}
                    </span>
                  </div>

                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateItemQty(pack.id, pack.name, pack.packPrice, pack.duration, 1)
                      }
                      className="min-h-[44px] rounded-[10px] border border-[#0B2B26] bg-[#EEF6F0] px-4 py-2 text-xs font-semibold text-[#0B2B26] transition hover:bg-[#0B2B26] hover:text-white"
                    >
                      Add pack
                    </button>
                  ) : (
                    <div className="flex min-h-[44px] items-center gap-2 rounded-[10px] bg-[#0B2B26] px-3 py-1.5 text-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateItemQty(pack.id, pack.name, pack.packPrice, pack.duration, -1)
                        }
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                      <span className="min-w-4 text-center text-xs font-bold">{qty}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateItemQty(pack.id, pack.name, pack.packPrice, pack.duration, 1)
                        }
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* OFFERS BANNER */}
      <section className="mx-auto max-w-[1200px] px-4 pt-10 md:px-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-[12px] border border-[#E3E8E4] bg-[#EEF6F0] p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-[#0B2B26]" strokeWidth={1.75} />
            <div>
              <div className="text-sm font-bold text-[#0E1A17]">
                Use code <span className="font-mono">WELCOME100</span> for Rs 100 off your first booking
              </div>
              <div className="text-xs text-[#4B5A55]">
                Also active: FIRST50 (Rs 50 off) and WEEKEND15 (15% off)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCouponCode("WELCOME100");
              setIsCartOpen(true);
            }}
            className="min-h-[44px] rounded-[10px] bg-[#0B2B26] px-4 py-2 text-xs font-semibold text-white hover:bg-[#163832]"
          >
            Apply in cart
          </button>
        </div>
      </section>

      {/* HOW IT WORKS (3 PLAIN STEPS) */}
      <section className="mx-auto max-w-[1200px] px-4 pt-10 md:px-6">
        <h2 className="text-lg font-bold text-[#0E1A17] sm:text-xl">
          How Shell works
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              step: "1. Choose a service",
              desc: "Pick home cleaning, errands, repairs, or groceries with upfront INR pricing.",
            },
            {
              step: "2. Pick slot & address",
              desc: "Select your Dwarka society tower, gate instructions, and preferred time slot.",
            },
            {
              step: "3. Pay after approval",
              desc: "Share the door OTP to start. Pay via UPI, card, or cash once the job is done.",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="rounded-[12px] border border-[#E3E8E4] bg-white p-4"
            >
              <div className="text-sm font-bold text-[#0B2B26]">{s.step}</div>
              <p className="mt-1 text-xs text-[#4B5A55]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE INTERACTIVE MAP */}
      <section id="live-map" className="mx-auto max-w-[1200px] px-4 pb-12 pt-10 md:px-6">
        <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h2 className="text-lg font-bold text-[#0E1A17] sm:text-xl">
                Service area &amp; live helper map (Dwarka, Delhi)
              </h2>
              <p className="mt-1 text-xs text-[#4B5A55] sm:text-sm">
                Click anywhere on the map to set your delivery pin and check nearby helpers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {LOCATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`min-h-[36px] rounded-[10px] border px-3 py-1.5 text-xs font-semibold transition ${
                    activeLocation.id === preset.id
                      ? "border-[#0B2B26] bg-[#0B2B26] text-white"
                      : "border-[#E3E8E4] bg-[#F7F8F6] text-[#4B5A55] hover:border-[#0B2B26]"
                  }`}
                >
                  {preset.name.split(",")[0]}
                </button>
              ))}
            </div>
          </div>

          <LiveMap
            center={customCoords}
            markers={mapMarkers}
            onLocationSelect={handleMapClick}
            height="360px"
          />
        </div>
      </section>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[#E3E8E4] bg-white py-1.5 md:hidden"
      >
        <a href="#" className="flex min-h-[44px] flex-col items-center justify-center text-[11px] font-semibold text-[#0B2B26]">
          <HomeIcon className="h-5 w-5" strokeWidth={1.75} />
          <span>Home</span>
        </a>
        <a href="#catalog" className="flex min-h-[44px] flex-col items-center justify-center text-[11px] font-medium text-[#4B5A55]">
          <LayoutGrid className="h-5 w-5" strokeWidth={1.75} />
          <span>Services</span>
        </a>
        <button
          type="button"
          onClick={() => setIsOrdersOpen(true)}
          className="flex min-h-[44px] flex-col items-center justify-center text-[11px] font-medium text-[#4B5A55]"
        >
          <PackageCheck className="h-5 w-5" strokeWidth={1.75} />
          <span>Orders</span>
        </button>
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex min-h-[44px] flex-col items-center justify-center text-[11px] font-medium text-[#4B5A55]"
        >
          <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
          <span>Cart {cartCount > 0 ? `(${cartCount})` : ""}</span>
        </button>
        <Link href="/app" className="flex min-h-[44px] flex-col items-center justify-center text-[11px] font-medium text-[#4B5A55]">
          <User className="h-5 w-5" strokeWidth={1.75} />
          <span>Account</span>
        </Link>
      </nav>

      {/* LOCATION MODAL */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-[12px] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3E8E4] px-5 py-4">
              <h3 className="text-base font-bold text-[#0E1A17]">
                Select delivery &amp; service location
              </h3>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="rounded-[10px] p-1.5 text-[#4B5A55] hover:bg-[#F7F8F6]"
                aria-label="Close location modal"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                {LOCATION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`rounded-[10px] border px-3 py-2 text-left text-xs font-semibold ${
                      activeLocation.id === preset.id
                        ? "border-[#0B2B26] bg-[#EEF6F0] text-[#0B2B26]"
                        : "border-[#E3E8E4] bg-white text-[#4B5A55]"
                    }`}
                  >
                    <div>{preset.name}</div>
                    <div className="text-[11px] font-normal">
                      {preset.etaMins} mins ETA
                    </div>
                  </button>
                ))}
              </div>
              <LiveMap
                center={customCoords}
                markers={mapMarkers}
                onLocationSelect={handleMapClick}
                height="260px"
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="min-h-[44px] rounded-[10px] bg-[#0B2B26] px-6 py-2 text-sm font-semibold text-white hover:bg-[#163832]"
                >
                  Confirm location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART & 3-STEP CHECKOUT DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3E8E4] px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-[#0E1A17]">Your cart</h3>
                <p className="text-xs text-[#4B5A55]">{customLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-[10px] p-1.5 text-[#4B5A55] hover:bg-[#F7F8F6]"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {cartEntries.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingCart className="mx-auto h-10 w-10 text-[#7C8A85]" strokeWidth={1.75} />
                  <p className="mt-3 text-sm font-semibold text-[#0E1A17]">
                    Your cart is empty
                  </p>
                  <p className="mt-1 text-xs text-[#4B5A55]">
                    Add a service or grocery item to book.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {cartEntries.map(([id, entry]) => (
                      <div
                        key={id}
                        className="flex items-center justify-between gap-3 rounded-[12px] border border-[#E3E8E4] bg-[#F7F8F6] p-3"
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#0E1A17]">
                            {entry.name}
                          </div>
                          <div className="text-xs text-[#4B5A55]">
                            {entry.unit} · Rs {entry.price}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-[10px] border border-[#0B2B26] bg-white px-2.5 py-1 text-[#0B2B26]">
                          <button
                            type="button"
                            onClick={() =>
                              updateItemQty(id, entry.name, entry.price, entry.unit, -1)
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>
                          <span className="min-w-4 text-center text-xs font-bold">
                            {entry.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateItemQty(id, entry.name, entry.price, entry.unit, 1)
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Step 2: Date & Time Slot */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0E1A17]">
                      Select time slot
                    </label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="mt-1.5 min-h-[44px] w-full rounded-[10px] border border-[#E3E8E4] bg-white px-3 text-sm text-[#0E1A17]"
                    >
                      <option>Today, 4:00 PM - 5:00 PM</option>
                      <option>Today, 5:00 PM - 6:00 PM</option>
                      <option>Tomorrow, 9:00 AM - 10:00 AM</option>
                      <option>Tomorrow, 11:00 AM - 12:00 PM</option>
                    </select>
                  </div>

                  {/* Coupon */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0E1A17]">
                      Coupon code
                    </label>
                    <div className="mt-1.5 flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="WELCOME100"
                        className="min-h-[44px] flex-1 rounded-[10px] border border-[#E3E8E4] px-3 text-sm uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="min-h-[44px] rounded-[10px] border border-[#0B2B26] px-4 text-xs font-semibold text-[#0B2B26] hover:bg-[#EEF6F0]"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="mt-1 text-xs text-[#C2362B]">{couponError}</p>
                    )}
                    {appliedCoupon && (
                      <p className="mt-1 text-xs font-semibold text-[#1E8E5A]">
                        {appliedCoupon.code} applied (-Rs {discount})
                      </p>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-4 text-sm">
                    <div className="space-y-1.5 text-[#4B5A55]">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>Rs {itemSubtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform fee</span>
                        <span>Rs {platformFee}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-[#1E8E5A]">
                          <span>Coupon discount</span>
                          <span>-Rs {discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-[#E3E8E4] pt-2 text-base font-bold text-[#0E1A17]">
                        <span>Total</span>
                        <span>Rs {grandTotal}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Payment */}
                  <div>
                    <div className="mb-2 text-xs font-semibold text-[#0E1A17]">
                      Payment method
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "upi" as PaymentMethod, label: "UPI", icon: Smartphone },
                        { id: "cash_after" as PaymentMethod, label: "Cash after service", icon: Banknote },
                        { id: "card" as PaymentMethod, label: "Card / Netbanking", icon: CreditCard },
                        { id: "wallet" as PaymentMethod, label: "Shell Wallet", icon: Wallet },
                      ].map((pm) => {
                        const IconComp = pm.icon;
                        const active = paymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`flex min-h-[44px] items-center gap-2 rounded-[10px] border p-2.5 text-left text-xs font-semibold ${
                              active
                                ? "border-[#0B2B26] bg-[#EEF6F0] text-[#0B2B26]"
                                : "border-[#E3E8E4] bg-white text-[#4B5A55]"
                            }`}
                          >
                            <IconComp className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                            <span>{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {cartEntries.length > 0 && (
              <div className="border-t border-[#E3E8E4] p-5">
                <button
                  type="button"
                  disabled={isPaying}
                  onClick={handlePlaceOrder}
                  className="min-h-[48px] w-full rounded-[10px] bg-[#0B2B26] text-sm font-semibold text-white transition hover:bg-[#163832] disabled:opacity-60"
                >
                  {isPaying ? "Confirming booking..." : `Book now · Rs ${grandTotal}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORDER TRACKING MODAL */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[12px] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3E8E4] px-5 py-4">
              <h3 className="text-base font-bold text-[#0E1A17]">
                {activeOrder ? `Order ${activeOrder.id}` : "Your orders"}
              </h3>
              <button
                type="button"
                onClick={() => setIsOrdersOpen(false)}
                className="rounded-[10px] p-1.5 text-[#4B5A55] hover:bg-[#F7F8F6]"
                aria-label="Close orders"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="p-5">
              {activeOrder ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-[12px] bg-[#EEF6F0] p-4">
                    <div>
                      <div className="text-sm font-bold text-[#0B2B26]">
                        Helper assigned: {activeOrder.helperName} ({activeOrder.helperRating} rating)
                      </div>
                      <div className="mt-0.5 text-xs text-[#4B5A55]">
                        Slot: {activeOrder.slot} · ETA {activeOrder.etaMins} mins
                      </div>
                    </div>
                    <div className="rounded-[10px] bg-[#0B2B26] px-3 py-2 text-center text-white">
                      <div className="text-[10px] uppercase tracking-wider text-[#8EB69B]">
                        Door OTP
                      </div>
                      <div className="font-mono text-lg font-bold text-[#F2C318]">
                        {activeOrder.doorOtp}
                      </div>
                    </div>
                  </div>

                  <LiveMap
                    center={activeOrder.coords}
                    markers={[
                      {
                        id: "order-dest",
                        lat: activeOrder.coords[0],
                        lng: activeOrder.coords[1],
                        title: "Your address",
                        type: "user",
                      },
                      {
                        id: "order-helper",
                        lat: activeOrder.coords[0] - 0.0028,
                        lng: activeOrder.coords[1] + 0.0035,
                        title: activeOrder.helperName,
                        subtitle: "On the way",
                        type: "helper",
                      },
                    ]}
                    routeTo={[
                      activeOrder.coords[0] - 0.0028,
                      activeOrder.coords[1] + 0.0035,
                    ]}
                    height="240px"
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-[#4B5A55]">
                  No orders yet. Add a service or grocery item to book.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  qty,
  onAdd,
  onRemove,
}: {
  item: CatalogItem;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col justify-between rounded-[12px] border border-[#E3E8E4] bg-white p-4 transition hover:border-[#0B2B26]">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#EEF6F0] text-[#0B2B26]">
            <RenderIcon name={item.iconName} className="h-5 w-5" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#F7F8F6] px-2 py-1 text-[11px] font-medium text-[#4B5A55]">
            <Clock className="h-3 w-3 text-[#1E8E5A]" strokeWidth={1.75} />
            {item.eta}
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#4B5A55]">
            <Star className="h-3 w-3 fill-[#F2C318] text-[#F2C318]" />
            <span className="font-semibold text-[#0E1A17]">{item.rating}</span>
            <span>({item.reviews})</span>
            <span>·</span>
            <span>{item.unit}</span>
          </div>
          <h3 className="mt-1 line-clamp-2 text-sm font-bold text-[#0E1A17]">
            {item.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-[#4B5A55]">
            {item.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#E3E8E4] pt-3">
        <div>
          <span className="text-sm font-bold text-[#0E1A17]">Rs {item.price}</span>
          {item.mrp && (
            <span className="ml-1.5 text-xs text-[#7C8A85] line-through">
              Rs {item.mrp}
            </span>
          )}
        </div>

        {qty === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="min-h-[44px] rounded-[10px] border border-[#0B2B26] bg-[#EEF6F0] px-4 py-2 text-xs font-semibold text-[#0B2B26] transition hover:bg-[#0B2B26] hover:text-white"
          >
            Add to cart
          </button>
        ) : (
          <div className="flex min-h-[44px] items-center gap-2 rounded-[10px] bg-[#0B2B26] px-3 py-1.5 text-white">
            <button type="button" onClick={onRemove} aria-label="Decrease quantity">
              <Minus className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <span className="min-w-4 text-center text-xs font-bold">{qty}</span>
            <button type="button" onClick={onAdd} aria-label="Increase quantity">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
