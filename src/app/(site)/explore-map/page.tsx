"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crosshair, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { LiveMap, type MapMarker } from "@/components/LiveMap";

const DWARKA_CENTER: [number, number] = [28.5921, 77.046];

const TOWERS: MapMarker[] = [
  { id: "t-a", lat: 28.5932, lng: 77.0452, title: "Tower A", subtitle: "Gate 1 · 12 floors", type: "hub" },
  { id: "t-b", lat: 28.5935, lng: 77.0465, title: "Tower B", subtitle: "Gate 1 · 14 floors", type: "hub" },
  { id: "t-c", lat: 28.5925, lng: 77.0472, title: "Tower C", subtitle: "Gate 2 · 12 floors", type: "hub" },
  { id: "t-d", lat: 28.5915, lng: 77.0468, title: "Tower D", subtitle: "Gate 2 · 14 floors", type: "hub" },
  { id: "t-e", lat: 28.5912, lng: 77.0451, title: "Tower E", subtitle: "Gate 3 · 10 floors", type: "hub" },
  { id: "t-f", lat: 28.5922, lng: 77.0445, title: "Tower F", subtitle: "Gate 3 · 12 floors", type: "hub" },
];

const GATES: MapMarker[] = [
  { id: "g-1", lat: 28.5939, lng: 77.0458, title: "Gate 1 (Main)", subtitle: "Open 24 hours · Guard desk", type: "user" },
  { id: "g-2", lat: 28.5920, lng: 77.0479, title: "Gate 2 (Market)", subtitle: "6:00 AM - 11:00 PM", type: "user" },
  { id: "g-3", lat: 28.5906, lng: 77.0450, title: "Gate 3 (Metro)", subtitle: "5:30 AM - 10:30 PM", type: "user" },
];

const STORES: MapMarker[] = [
  { id: "s-1", lat: 28.5945, lng: 77.0485, title: "Dwarka Fresh Mart", subtitle: "Grocery · 200m · 7 AM - 11 PM", type: "helper" },
  { id: "s-2", lat: 28.5902, lng: 77.0488, title: "Apollo Care Pharmacy", subtitle: "Pharmacy · 350m · 24 hours", type: "helper" },
  { id: "s-3", lat: 28.5898, lng: 77.0435, title: "CleanPress Laundry", subtitle: "Laundry · 400m · 8 AM - 9 PM", type: "helper" },
  { id: "s-4", lat: 28.5948, lng: 77.0432, title: "Sharma Hardware & Tools", subtitle: "Hardware · 450m · 9 AM - 8 PM", type: "helper" },
];

function isInsideDwarkaDemo(lat: number, lng: number): boolean {
  return lat >= 28.585 && lat <= 28.600 && lng >= 77.038 && lng <= 77.055;
}

export default function ExploreMapPage() {
  const [coords, setCoords] = useState<[number, number]>(DWARKA_CENTER);
  const [showTowers, setShowTowers] = useState(true);
  const [showGates, setShowGates] = useState(true);
  const [showStores, setShowStores] = useState(true);
  const [geoStatus, setGeoStatus] = useState<string>("");

  const inZone = isInsideDwarkaDemo(coords[0], coords[1]);

  const markers = useMemo(() => {
    const list: MapMarker[] = [
      {
        id: "selected-pin",
        lat: coords[0],
        lng: coords[1],
        title: "Selected Pin",
        subtitle: inZone ? "Service available" : "Outside launch zone",
        type: "user",
      },
    ];
    if (showTowers) list.push(...TOWERS);
    if (showGates) list.push(...GATES);
    if (showStores) list.push(...STORES);
    return list;
  }, [coords, inZone, showTowers, showGates, showStores]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Geolocation is not supported by your browser.");
      return;
    }
    setGeoStatus("Requesting location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.latitude, pos.coords.longitude]);
        setGeoStatus("Location updated.");
      },
      () => {
        setGeoStatus("Location permission denied. Using Dwarka Sector 12.");
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#0E1A17]">
      <header className="border-b border-[#E3E8E4] bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 md:px-6">
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
                Explore Dwarka Service Map
              </h1>
              <p className="text-xs text-[#4B5A55]">
                Towers, gates, nearby stores, and coverage check
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] bg-[#0B2B26] px-4 text-xs font-semibold text-white hover:bg-[#163832]"
          >
            <Crosshair className="h-4 w-4 text-[#F2C318]" strokeWidth={1.75} />
            Use my current location
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-6 md:px-6">
        {geoStatus && (
          <div className="rounded-[10px] border border-[#E3E8E4] bg-white px-4 py-2.5 text-xs text-[#4B5A55]">
            {geoStatus}
          </div>
        )}

        {/* Service Area Check Banner */}
        <div
          className={`flex items-center gap-3 rounded-[12px] border p-4 ${
            inZone
              ? "border-[#1E8E5A]/30 bg-[#EEF6F0] text-[#0B2B26]"
              : "border-[#C98A00]/30 bg-amber-50 text-[#0E1A17]"
          }`}
        >
          {inZone ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1E8E5A]" strokeWidth={1.75} />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-[#C98A00]" strokeWidth={1.75} />
          )}
          <div className="text-sm">
            {inZone ? (
              <span>
                <strong>Service available</strong> at ({coords[0].toFixed(4)}, {coords[1].toFixed(4)}). Same-day slots open.
              </span>
            ) : (
              <span>
                <strong>Outside launch zone.</strong> Nearest covered society is Metro View Apartments, Dwarka Sector 12.
              </span>
            )}
          </div>
        </div>

        {/* Layer Chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Towers (A-F)", active: showTowers, toggle: () => setShowTowers(!showTowers) },
            { label: "Gates & Timings", active: showGates, toggle: () => setShowGates(!showGates) },
            { label: "Nearby Stores", active: showStores, toggle: () => setShowStores(!showStores) },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.toggle}
              className={`min-h-[40px] rounded-[10px] border px-3.5 text-xs font-semibold transition ${
                chip.active
                  ? "border-[#0B2B26] bg-[#0B2B26] text-white"
                  : "border-[#E3E8E4] bg-white text-[#4B5A55]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <LiveMap
          center={coords}
          markers={markers}
          onLocationSelect={(lat, lng) => setCoords([lat, lng])}
          height="460px"
        />
      </div>
    </div>
  );
}
