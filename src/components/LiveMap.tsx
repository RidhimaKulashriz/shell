"use client";

import { useEffect, useRef } from "react";
import type LType from "leaflet";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type: "user" | "helper" | "hub";
}

interface LiveMapProps {
  center: [number, number];
  markers: MapMarker[];
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
  routeTo?: [number, number] | null;
}

export function LiveMap({
  center,
  markers,
  onLocationSelect,
  height = "380px",
  routeTo = null,
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const layerGroupRef = useRef<LType.LayerGroup | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initMap() {
      if (!containerRef.current || mapRef.current) return;
      const L = (await import("leaflet")).default;

      if (!mounted || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center,
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const group = L.layerGroup().addTo(map);

      if (onLocationSelect) {
        map.on("click", (e: LType.LeafletMouseEvent) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }

      mapRef.current = map;
      layerGroupRef.current = group;
    }

    initMap();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function updateMarkers() {
      if (!mapRef.current || !layerGroupRef.current) return;
      const L = (await import("leaflet")).default;
      const group = layerGroupRef.current;
      group.clearLayers();

      mapRef.current.setView(center, mapRef.current.getZoom(), { animate: true });

      markers.forEach((m) => {
        const color =
          m.type === "user"
            ? "#0B2B26"
            : m.type === "helper"
              ? "#F2C318"
              : "#10B981";
        const border = m.type === "helper" ? "#051F20" : "#FFFFFF";
        const label =
          m.type === "user" ? "YOU" : m.type === "helper" ? "★" : "HUB";

        const icon = L.divIcon({
          className: "shell-map-pin",
          html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:${color};border:3px solid ${border};color:${m.type === "helper" ? "#051F20" : "#FFFFFF"};font-weight:800;font-size:10px;box-shadow:0 4px 12px rgba(0,0,0,0.28);">${label}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker([m.lat, m.lng], { icon }).addTo(group);
        marker.bindPopup(
          `<div style="font-family:system-ui,sans-serif;min-width:140px;">
            <strong style="font-size:13px;color:#051F20;">${m.title}</strong>
            ${m.subtitle ? `<div style="font-size:11px;color:#475569;margin-top:2px;">${m.subtitle}</div>` : ""}
          </div>`
        );
      });

      if (routeTo) {
        L.polyline([center, routeTo], {
          color: "#0B2B26",
          weight: 4,
          dashArray: "8 8",
          opacity: 0.85,
        }).addTo(group);
      }
    }

    updateMarkers();
  }, [center, markers, routeTo]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={containerRef} style={{ height, width: "100%" }} className="z-0" />
      {onLocationSelect && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md backdrop-blur">
          Click anywhere on the map to set your delivery pin
        </div>
      )}
    </div>
  );
}
