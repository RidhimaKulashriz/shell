"use client";

import { useMemo, useState } from "react";
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
  Sparkles,
} from "lucide-react";
import { LiveMap, type MapMarker } from "@/components/LiveMap";
import {
  CATEGORIES,
  LOCATION_PRESETS,
  STORE_ITEMS,
  type CatalogItem,
  type CategoryId,
  type LocationPreset,
} from "@/lib/store-catalog";

type PaymentMethod = "gpay" | "wallet" | "card" | "cod";

interface OrderRecord {
  id: string;
  items: { item: CatalogItem; qty: number }[];
  total: number;
  paymentMethod: PaymentMethod;
  locationName: string;
  coords: [number, number];
  etaMins: number;
  helperName: string;
  helperRating: number;
  status: "confirmed" | "assigned" | "ontheway";
  createdAt: string;
}

export function ShellStorefront() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  const [activeLocation, setActiveLocation] = useState<LocationPreset>(
    LOCATION_PRESETS[0]
  );
  const [customCoords, setCustomCoords] = useState<[number, number]>([
    LOCATION_PRESETS[0].lat,
    LOCATION_PRESETS[0].lng,
  ]);
  const [customLabel, setCustomLabel] = useState<string>(
    LOCATION_PRESETS[0].name
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("gpay");
  const [isPaying, setIsPaying] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return STORE_ITEMS.filter((item) => {
      const matchesCat =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const goodsList = useMemo(
    () => filteredItems.filter((i) => i.kind === "good"),
    [filteredItems]
  );
  const servicesList = useMemo(
    () => filteredItems.filter((i) => i.kind === "service"),
    [filteredItems]
  );

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({
        item: STORE_ITEMS.find((i) => i.id === id)!,
        qty,
      }))
      .filter((entry) => Boolean(entry.item));
  }, [cart]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, entry) => sum + entry.qty, 0),
    [cartItems]
  );

  const itemSubtotal = useMemo(
    () =>
      cartItems.reduce((sum, entry) => sum + entry.item.price * entry.qty, 0),
    [cartItems]
  );

  const deliveryFee = itemSubtotal > 0 && itemSubtotal < 199 ? 25 : 0;
  const grandTotal = itemSubtotal + deliveryFee;

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = (prev[id] ?? 0) + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const handleSelectPreset = (preset: LocationPreset) => {
    setActiveLocation(preset);
    setCustomCoords([preset.lat, preset.lng]);
    setCustomLabel(preset.name);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setCustomCoords([lat, lng]);
    setCustomLabel(
      `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    );
  };

  const mapMarkers: MapMarker[] = useMemo(() => {
    const [lat, lng] = customCoords;
    return [
      {
        id: "user-pin",
        lat,
        lng,
        title: customLabel,
        subtitle: `Delivery & Service Pin • ${activeLocation.etaMins} mins ETA`,
        type: "user",
      },
      {
        id: "hub-1",
        lat: lat + 0.0055,
        lng: lng - 0.0045,
        title: "Shell Dark Store & Hub",
        subtitle: "Fresh groceries & essentials stocked",
        type: "hub",
      },
      {
        id: "helper-1",
        lat: lat - 0.0032,
        lng: lng + 0.0041,
        title: "Isha Kapoor (Verified Helper)",
        subtitle: "★ 4.94 • Cleaning & Home Care • 4 mins away",
        type: "helper",
      },
      {
        id: "helper-2",
        lat: lat + 0.0028,
        lng: lng + 0.0062,
        title: "Rajesh Kumar (Electrician & AC)",
        subtitle: "★ 4.91 • 6 mins away",
        type: "helper",
      },
      {
        id: "helper-3",
        lat: lat - 0.0048,
        lng: lng - 0.0038,
        title: "Amit Verma (Express Rider)",
        subtitle: "★ 4.89 • 10-min grocery delivery",
        type: "helper",
      },
    ];
  }, [customCoords, customLabel, activeLocation.etaMins]);

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;
    setIsPaying(true);

    setTimeout(() => {
      const newOrder: OrderRecord = {
        id: `SHL-${Math.floor(100000 + Math.random() * 900000)}`,
        items: cartItems,
        total: grandTotal,
        paymentMethod,
        locationName: customLabel,
        coords: customCoords,
        etaMins: activeLocation.etaMins,
        helperName: "Isha Kapoor",
        helperRating: 4.94,
        status: "ontheway",
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setOrders((prev) => [newOrder, ...prev]);
      setActiveOrder(newOrder);
      setCart({});
      setIsPaying(false);
      setIsCartOpen(false);
      setIsOrdersOpen(true);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* STICKY TOP NAVBAR (Blinkit + Urban Company style) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          {/* Brand + Location */}
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-[#0B2B26]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B2B26] text-lg font-black text-[#F2C318]">
                S
              </span>
              <span>Shell</span>
            </a>

            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-left transition hover:border-emerald-500 hover:bg-emerald-50/40"
            >
              <MapPin className="h-4 w-4 shrink-0 text-emerald-700" />
              <div className="leading-tight">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                  <span>Delivery in {activeLocation.etaMins} mins</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="max-w-[160px] truncate text-[11px] text-slate-500 sm:max-w-[220px]">
                  {customLabel}
                </div>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="order-3 w-full md:order-2 md:max-w-md md:flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 'milk', 'AC repair', 'cleaning', 'electrician'..."
                className="w-full rounded-xl border border-slate-200 bg-slate-100/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/15"
              />
            </div>
          </div>

          {/* Right Actions: Map, Orders, Cart */}
          <div className="order-2 flex items-center gap-2 md:order-3">
            <a
              href="#live-map"
              className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
            >
              <Navigation className="h-3.5 w-3.5 text-emerald-700" />
              Live Map
            </a>

            <button
              type="button"
              onClick={() => setIsOrdersOpen(true)}
              className="relative inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <PackageCheck className="h-4 w-4 text-emerald-700" />
              <span className="hidden sm:inline">Orders</span>
              {orders.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                  {orders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B2B26] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#163832]"
            >
              <ShoppingCart className="h-4 w-4 text-[#F2C318]" />
              {cartCount > 0 ? (
                <span>
                  {cartCount} {cartCount === 1 ? "item" : "items"} · ₹{grandTotal}
                </span>
              ) : (
                <span>Cart</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="mx-auto max-w-7xl px-4 pt-5 md:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B2B26] via-[#133C35] to-[#051F20] p-6 text-white shadow-lg md:p-10">
          <div className="grid items-center gap-6 md:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#F2C318] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Live in {activeLocation.area} · No Waitlist
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                Daily groceries &amp; verified home services in{" "}
                <span className="text-[#F2C318]">
                  {activeLocation.etaMins} mins
                </span>
                .
              </h1>
              <p className="mt-3 max-w-xl text-sm text-emerald-100/90 sm:text-base">
                Order fresh milk, fruits, and essentials or book background-verified
                electricians, cleaners, and salon pros — all in one cart with
                instant UPI &amp; live GPS tracking.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="#catalog"
                  className="rounded-xl bg-[#F2C318] px-5 py-2.5 text-sm font-bold text-[#051F20] shadow-sm transition hover:bg-yellow-300"
                >
                  Shop Goods &amp; Services
                </a>
                <a
                  href="#live-map"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  <MapPin className="h-4 w-4 text-[#F2C318]" />
                  View Live Map
                </a>
              </div>
            </div>

            {/* Quick Stats / Trust Strip */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-extrabold text-[#F2C318]">
                  10–12m
                </div>
                <div className="mt-1 text-xs text-emerald-100">
                  Express grocery delivery from nearby dark stores
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-extrabold text-[#F2C318]">
                  100%
                </div>
                <div className="mt-1 text-xs text-emerald-100">
                  ID-verified helpers &amp; 30-day service warranty
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-extrabold text-[#F2C318]">
                  ★ 4.9
                </div>
                <div className="mt-1 text-xs text-emerald-100">
                  Average rating across 45,000+ completed jobs
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-extrabold text-[#F2C318]">
                  ₹0 Fee
                </div>
                <div className="mt-1 text-xs text-emerald-100">
                  Free delivery &amp; zero convenience fee above ₹199
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER PILLS */}
      <section
        id="catalog"
        className="mx-auto max-w-7xl px-4 pt-6 md:px-6"
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-[#0B2B26] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* REAL GOODS SECTION (Blinkit Style) */}
      {goodsList.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Fresh Groceries &amp; Daily Essentials
              </h2>
              <p className="text-xs text-slate-500 sm:text-sm">
                Delivered in 10–12 minutes from your nearest Shell Hub
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
            {goodsList.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                qty={cart[item.id] ?? 0}
                onAdd={() => updateQty(item.id, 1)}
                onRemove={() => updateQty(item.id, -1)}
              />
            ))}
          </div>
        </section>
      )}

      {/* REAL HOME SERVICES SECTION (Urban Company Style) */}
      {servicesList.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 md:px-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Verified Home Services &amp; Repairs
              </h2>
              <p className="text-xs text-slate-500 sm:text-sm">
                Transparent pricing · Background-verified professionals
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {servicesList.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                qty={cart[item.id] ?? 0}
                onAdd={() => updateQty(item.id, 1)}
                onRemove={() => updateQty(item.id, -1)}
              />
            ))}
          </div>
        </section>
      )}

      {filteredItems.length === 0 && (
        <div className="mx-auto max-w-7xl px-4 py-16 text-center md:px-6">
          <p className="text-lg font-semibold text-slate-700">
            No goods or services matched &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-3 rounded-xl bg-[#0B2B26] px-4 py-2 text-sm font-semibold text-white"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* REAL INTERACTIVE MAP SECTION */}
      <section
        id="live-map"
        className="mx-auto max-w-7xl px-4 pb-16 pt-12 md:px-6"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                <Navigation className="h-3.5 w-3.5" />
                Live GPS &amp; Helper Map
              </div>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                See your location &amp; nearby helpers in real time
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Click anywhere on the map to move your delivery pin, or tap any
                marker to see helper ratings and hub distance.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {LOCATION_PRESETS.slice(0, 3).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeLocation.id === preset.id
                      ? "bg-[#0B2B26] text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
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
            height="420px"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full bg-[#0B2B26]" />
                Your Pin ({customLabel})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full bg-[#F2C318] ring-1 ring-[#051F20]" />
                Verified Helpers Nearby
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                Shell Dark Store Hub
              </span>
            </div>
            <div className="font-semibold text-emerald-700">
              Estimated arrival: {activeLocation.etaMins} mins
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING BOTTOM CART BAR ON MOBILE */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-md md:hidden">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-[#0B2B26] px-5 py-3.5 text-white shadow-xl"
          >
            <div className="text-left">
              <div className="text-xs font-medium text-emerald-200">
                {cartCount} {cartCount === 1 ? "ITEM" : "ITEMS"}
              </div>
              <div className="text-base font-extrabold">₹{grandTotal}</div>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-[#F2C318] px-4 py-2 text-sm font-bold text-[#051F20]">
              View Cart &amp; Pay
            </div>
          </button>
        </div>
      )}

      {/* LOCATION PICKER MODAL */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                Select Delivery &amp; Service Location
              </h3>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 flex flex-wrap gap-2">
                {LOCATION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                      activeLocation.id === preset.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div>{preset.name}</div>
                    <div className="text-[11px] font-normal text-slate-500">
                      {preset.etaMins} mins ETA
                    </div>
                  </button>
                ))}
              </div>
              <LiveMap
                center={customCoords}
                markers={mapMarkers}
                onLocationSelect={handleMapClick}
                height="280px"
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="rounded-xl bg-[#0B2B26] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#163832]"
                >
                  Confirm Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER CART & GPAY CHECKOUT DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Your Cart
                </h3>
                <p className="text-xs text-slate-500">
                  Delivery to {customLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cartItems.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingCart className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-base font-bold text-slate-700">
                    Your cart is empty
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Add groceries or home services to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {cartItems.map(({ item, qty }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${item.accentBg}`}
                          >
                            {item.emoji}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {item.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.unit} · ₹{item.price}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-2 py-1 text-emerald-900">
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, -1)}
                            className="p-0.5 hover:text-emerald-700"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-4 text-center text-xs font-bold">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, 1)}
                            className="p-0.5 hover:text-emerald-700"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bill Details */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                    <div className="font-bold text-slate-900">Bill Details</div>
                    <div className="mt-2 space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>Item Total</span>
                        <span>₹{itemSubtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery &amp; Convenience</span>
                        <span className={deliveryFee === 0 ? "font-semibold text-emerald-700" : ""}>
                          {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-extrabold text-slate-900">
                        <span>To Pay</span>
                        <span>₹{grandTotal}</span>
                      </div>
                    </div>
                  </div>

                  {/* GPay-style Payment Selector */}
                  <div>
                    <div className="mb-2 text-sm font-bold text-slate-900">
                      Pay Using (GPay / UPI / Wallet)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          id: "gpay" as PaymentMethod,
                          label: "Google Pay / UPI",
                          icon: Smartphone,
                        },
                        {
                          id: "wallet" as PaymentMethod,
                          label: "Shell Wallet (₹1,500)",
                          icon: Wallet,
                        },
                        {
                          id: "card" as PaymentMethod,
                          label: "Credit / Debit Card",
                          icon: CreditCard,
                        },
                        {
                          id: "cod" as PaymentMethod,
                          label: "Cash on Delivery",
                          icon: Banknote,
                        },
                      ].map((pm) => {
                        const IconComp = pm.icon;
                        const active = paymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-semibold transition ${
                              active
                                ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <IconComp className="h-4 w-4 shrink-0" />
                            <span>{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-slate-100 p-5">
                <button
                  type="button"
                  disabled={isPaying}
                  onClick={handlePlaceOrder}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0B2B26] py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#163832] disabled:opacity-60"
                >
                  {isPaying ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <span>Pay ₹{grandTotal} &amp; Place Order</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIVE ORDER TRACKER MODAL */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                {activeOrder ? `Tracking Order ${activeOrder.id}` : "My Orders"}
              </h3>
              <button
                type="button"
                onClick={() => setIsOrdersOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {activeOrder ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-950">
                    <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
                    <div>
                      <div className="text-base font-extrabold">
                        Order Confirmed! Arriving in {activeOrder.etaMins} mins
                      </div>
                      <div className="text-xs text-emerald-800">
                        {activeOrder.helperName} (★ {activeOrder.helperRating})
                        is on the way to {activeOrder.locationName}
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
                        title: "Your Location",
                        type: "user",
                      },
                      {
                        id: "order-helper",
                        lat: activeOrder.coords[0] - 0.0028,
                        lng: activeOrder.coords[1] + 0.0035,
                        title: activeOrder.helperName,
                        subtitle: "On the way to you",
                        type: "helper",
                      },
                    ]}
                    routeTo={[
                      activeOrder.coords[0] - 0.0028,
                      activeOrder.coords[1] + 0.0035,
                    ]}
                    height="240px"
                  />

                  <div className="rounded-2xl border border-slate-200 p-4 text-sm">
                    <div className="font-bold text-slate-900">
                      Order Summary · ₹{activeOrder.total}
                    </div>
                    <ul className="mt-2 space-y-1 text-slate-600">
                      {activeOrder.items.map(({ item, qty }) => (
                        <li key={item.id} className="flex justify-between">
                          <span>
                            {qty} × {item.name}
                          </span>
                          <span>₹{item.price * qty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  No orders yet. Add items from the store to place your first
                  instant order!
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
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:border-emerald-500/50 hover:shadow-md">
      <div>
        <div
          className={`relative flex h-28 items-center justify-center rounded-xl text-5xl ${item.accentBg}`}
        >
          <span>{item.emoji}</span>
          {item.badge && (
            <span className="absolute left-2 top-2 rounded-md bg-[#0B2B26] px-2 py-0.5 text-[10px] font-bold text-[#F2C318]">
              {item.badge}
            </span>
          )}
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-sm">
            <Clock className="h-3 w-3 text-emerald-600" />
            {item.eta}
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-slate-700">{item.rating}</span>
            <span>({item.reviews})</span>
            <span>·</span>
            <span>{item.unit}</span>
          </div>
          <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-900">
            {item.name}
          </h3>
          {item.kind === "service" && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between pt-2">
        <div>
          <span className="text-base font-extrabold text-slate-900">
            ₹{item.price}
          </span>
          {item.mrp && (
            <span className="ml-1.5 text-xs text-slate-400 line-through">
              ₹{item.mrp}
            </span>
          )}
        </div>

        {qty === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="rounded-xl border border-emerald-600 bg-emerald-50 px-3.5 py-1.5 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-600 hover:text-white"
          >
            {item.kind === "service" ? "BOOK +" : "ADD +"}
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-[#0B2B26] px-2.5 py-1.5 text-white">
            <button
              type="button"
              onClick={onRemove}
              className="hover:text-[#F2C318]"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-4 text-center text-xs font-bold">{qty}</span>
            <button
              type="button"
              onClick={onAdd}
              className="hover:text-[#F2C318]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
