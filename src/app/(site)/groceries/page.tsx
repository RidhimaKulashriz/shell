"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, ShoppingCart, Plus, Minus, ShieldCheck } from "lucide-react";
import { STORE_ITEMS } from "@/lib/store-catalog";

const AISLES = [
  "All",
  "Fruits & Vegetables",
  "Dairy & Eggs",
  "Staples",
  "Beverages",
  "Household",
];

function getAisle(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("milk") || n.includes("egg") || n.includes("bread")) return "Dairy & Eggs";
  if (n.includes("tomato") || n.includes("apple")) return "Fruits & Vegetables";
  if (n.includes("rice")) return "Staples";
  if (n.includes("coffee")) return "Beverages";
  if (n.includes("detergent")) return "Household";
  return "Staples";
}

export default function GroceriesPage() {
  const [aisle, setAisle] = useState("All");
  const [query, setQuery] = useState("");
  const [substitution, setSubstitution] = useState("call");
  const [spendingCap, setSpendingCap] = useState("1500");
  const [cart, setCart] = useState<Record<string, number>>({});

  const groceries = useMemo(() => {
    return STORE_ITEMS.filter((i) => i.kind === "good").filter((item) => {
      const matchesAisle = aisle === "All" || getAisle(item.name) === aisle;
      const matchesQuery =
        !query.trim() || item.name.toLowerCase().includes(query.toLowerCase());
      return matchesAisle && matchesQuery;
    });
  }, [aisle, query]);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalAmount = groceries.reduce(
    (sum, item) => sum + (cart[item.id] ?? 0) * item.price,
    0
  );

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

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#0E1A17]">
      <header className="sticky top-0 z-30 border-b border-[#E3E8E4] bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border border-[#E3E8E4] px-3 text-xs font-semibold text-[#0E1A17] hover:bg-[#EEF6F0]"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
              Back
            </Link>
            <div>
              <h1 className="text-base font-bold text-[#0E1A17]">
                Groceries &amp; Daily Essentials
              </h1>
              <p className="text-xs text-[#4B5A55]">Dwarka Sector 12 Hub · 12 mins</p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] bg-[#0B2B26] px-4 text-xs font-semibold text-white"
          >
            <ShoppingCart className="h-4 w-4 text-[#F2C318]" strokeWidth={1.75} />
            <span>
              {totalItems} items · Rs {totalAmount}
            </span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <div>
            {/* Search & Aisles */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8A85]" strokeWidth={1.75} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search milk, bread, eggs, rice..."
                className="min-h-[44px] w-full rounded-[10px] border border-[#E3E8E4] bg-white pl-10 pr-4 text-sm"
              />
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {AISLES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAisle(a)}
                  className={`min-h-[40px] shrink-0 rounded-[10px] border px-3.5 text-xs font-semibold ${
                    aisle === a
                      ? "border-[#0B2B26] bg-[#0B2B26] text-white"
                      : "border-[#E3E8E4] bg-white text-[#4B5A55]"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {groceries.map((item) => {
                const qty = cart[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-[12px] border border-[#E3E8E4] bg-white p-4"
                  >
                    <div>
                      <span className="inline-block rounded-[6px] bg-[#EEF6F0] px-2 py-0.5 text-[11px] font-medium text-[#0B2B26]">
                        {item.unit}
                      </span>
                      <h2 className="mt-2 text-sm font-bold text-[#0E1A17]">
                        {item.name}
                      </h2>
                      <p className="mt-1 text-xs text-[#4B5A55]">{item.description}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#E3E8E4] pt-3">
                      <span className="text-sm font-bold text-[#0E1A17]">
                        Rs {item.price}
                      </span>
                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="min-h-[40px] rounded-[10px] border border-[#0B2B26] bg-[#EEF6F0] px-3 text-xs font-semibold text-[#0B2B26]"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex min-h-[40px] items-center gap-2 rounded-[10px] bg-[#0B2B26] px-2.5 text-white">
                          <button type="button" onClick={() => updateQty(item.id, -1)}>
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs font-bold">{qty}</span>
                          <button type="button" onClick={() => updateQty(item.id, 1)}>
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Store Preferences */}
          <aside className="space-y-4">
            <div className="rounded-[12px] border border-[#E3E8E4] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0E1A17]">
                <ShieldCheck className="h-4 w-4 text-[#1E8E5A]" strokeWidth={1.75} />
                <span>Order Preferences</span>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-[#0E1A17]">
                  If an item is out of stock
                </label>
                <select
                  value={substitution}
                  onChange={(e) => setSubstitution(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-[10px] border border-[#E3E8E4] bg-white px-3 text-xs"
                >
                  <option value="call">Call me before substituting</option>
                  <option value="closest">Pick closest alternative</option>
                  <option value="refund">Skip &amp; refund item</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-[#0E1A17]">
                  Per-order spending cap (Rs)
                </label>
                <input
                  type="number"
                  value={spendingCap}
                  onChange={(e) => setSpendingCap(e.target.value)}
                  className="mt-1.5 min-h-[44px] w-full rounded-[10px] border border-[#E3E8E4] px-3 text-sm"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
