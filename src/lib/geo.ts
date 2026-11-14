export type LatLng = { lat: number; lng: number };

export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const GEOFENCE_M = 150;
export const withinGeofence = (a: LatLng, b: LatLng, r = GEOFENCE_M) => haversine(a, b) <= r;

// ETA = travel + gate wait + walk from gate to tower + lift/floor time + buffer
export type EtaParams = { gateWait: number; walkPerTower: number; liftPerFloor: number; liftBase: number; buffer: number };
export const DEFAULT_ETA: EtaParams = { gateWait: 3, walkPerTower: 4, liftPerFloor: 0.3, liftBase: 2, buffer: 2 };
export function etaMinutes(distanceM: number, floor: number, p: EtaParams = DEFAULT_ETA, speedKmh = 18) {
  const travel = (distanceM / 1000 / speedKmh) * 60;
  return Math.max(1, Math.round(travel + p.gateWait + p.walkPerTower + p.liftBase + floor * p.liftPerFloor + p.buffer));
}
/** Learn a parameter from observed values (exponential moving average). */
export const learn = (current: number, observed: number, alpha = 0.2) => current * (1 - alpha) + observed * alpha;

// Pointy-top hex grid (axial). Resolution 8 is about 500m, 9 about 190m.
const SIZE: Record<number, number> = { 8: 0.0045, 9: 0.0017 };
const LAT0 = 28.6;
const kx = Math.cos((LAT0 * Math.PI) / 180);

export function hexId(lat: number, lng: number, res: 8 | 9 = 8): string {
  const s = SIZE[res], x = lng * kx, y = lat;
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / s, r = ((2 / 3) * y) / s;
  let rx = Math.round(q), rz = Math.round(r), ry = Math.round(-q - r);
  const dx = Math.abs(rx - q), dy = Math.abs(ry - (-q - r)), dz = Math.abs(rz - r);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
  return `h${res}:${rx}:${rz}`;
}
export function hexCenter(id: string): LatLng & { size: number } {
  const [h, q, r] = id.split(":");
  const res = Number(h.slice(1)), s = SIZE[res];
  const x = s * Math.sqrt(3) * (Number(q) + Number(r) / 2), y = s * 1.5 * Number(r);
  return { lat: y, lng: x / kx, size: s };
}

export function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  const k = Math.max(0, Math.min(1, t));
  return { lat: a.lat + (b.lat - a.lat) * k, lng: a.lng + (b.lng - a.lng) * k };
}
