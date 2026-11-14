// Geo helpers. PostGIS is not available in the managed sandbox, so points are stored as lat/lng doubles with
// an H3-style hex index (resolution 8 ~ 0.46km edge, resolution 9 ~ 0.17km edge) computed here. See ASSUMPTIONS.md.

export type LatLng = { lat: number; lng: number };
const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
const COS_DELHI = Math.cos(rad(28.6));

export function haversine(a: LatLng, b: LatLng) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
export const withinMeters = (a: LatLng, b: LatLng, m: number) => haversine(a, b) <= m;

export function pointInPolygon(p: LatLng, poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const SIZE: Record<number, number> = { 8: 0.0042, 9: 0.0016 }; // degrees of latitude per hex edge

export function latLngToHex(lat: number, lng: number, res: 8 | 9 = 8) {
  const size = SIZE[res];
  const x = lng * COS_DELHI;
  const y = lat;
  const q = ((Math.sqrt(3) / 3) * x - y / 3) / size;
  const r = ((2 / 3) * y) / size;
  // cube rounding
  let rx = Math.round(q);
  let rz = Math.round(r);
  const ry = Math.round(-q - r);
  const dx = Math.abs(rx - q);
  const dy = Math.abs(ry - (-q - r));
  const dz = Math.abs(rz - r);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy <= dz) rz = -rx - ry;
  return `h${res}_${rx}_${rz}`;
}

export function hexCenter(id: string): LatLng {
  const [h, q, r] = id.split("_");
  const size = SIZE[Number(h.slice(1))] ?? SIZE[8];
  const x = size * Math.sqrt(3) * (Number(q) + Number(r) / 2);
  const y = size * 1.5 * Number(r);
  return { lat: y, lng: x / COS_DELHI };
}

export function hexCorners(id: string): LatLng[] {
  const c = hexCenter(id);
  const size = SIZE[Number(id.split("_")[0].slice(1))] ?? SIZE[8];
  return Array.from({ length: 6 }, (_, i) => {
    const a = rad(60 * i - 30);
    return { lat: c.lat + size * Math.sin(a), lng: c.lng + (size * Math.cos(a)) / COS_DELHI };
  });
}

/** Seconds-level plausibility check: > 90 km/h inside a society is physically impossible for a helper. */
export function impossibleSpeed(a: LatLng & { ts: number }, b: LatLng & { ts: number }, maxKmh = 90) {
  const hours = Math.abs(b.ts - a.ts) / 3600000;
  if (hours === 0) return false;
  return haversine(a, b) / 1000 / hours > maxKmh;
}

export const walkMinutes = (meters: number) => Math.max(1, Math.round(meters / 70)); // ~4.2 km/h
export const rideMinutes = (meters: number) => Math.max(1, Math.round(meters / 330)); // ~20 km/h in city traffic

/** Nearest-neighbour + 2-opt ordering for stacked routes (small time-window heuristic). */
export function orderStops<T extends LatLng>(start: LatLng, stops: T[]): T[] {
  if (stops.length < 3) return stops.length === 2 && haversine(start, stops[1]) < haversine(start, stops[0]) ? [stops[1], stops[0]] : [...stops];
  const left = [...stops];
  const order: T[] = [];
  let cur: LatLng = start;
  while (left.length) {
    let bi = 0;
    for (let i = 1; i < left.length; i++) if (haversine(cur, left[i]) < haversine(cur, left[bi])) bi = i;
    cur = left[bi];
    order.push(left.splice(bi, 1)[0]);
  }
  const len = (o: T[]) => o.reduce((s, p, i) => s + haversine(i ? o[i - 1] : start, p), 0);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < order.length - 1; i++)
      for (let j = i + 1; j < order.length; j++) {
        const cand = [...order.slice(0, i), ...order.slice(i, j + 1).reverse(), ...order.slice(j + 1)];
        if (len(cand) + 1 < len(order)) {
          order.splice(0, order.length, ...cand);
          improved = true;
        }
      }
  }
  return order;
}

/** Project lat/lng into a 0..1 box for the SVG society map. */
export function projector(points: LatLng[], pad = 0.08) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 0.001;
  const spanLng = (maxLng - minLng) * COS_DELHI || 0.001;
  const span = Math.max(spanLat, spanLng);
  return (p: LatLng) => ({
    x: pad + (1 - 2 * pad) * (((p.lng - minLng) * COS_DELHI + (span - spanLng) / 2) / span),
    y: pad + (1 - 2 * pad) * (1 - ((p.lat - minLat) + (span - spanLat) / 2) / span),
  });
}
