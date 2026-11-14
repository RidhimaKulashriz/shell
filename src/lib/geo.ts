import { cellToBoundary, cellToLatLng, gridDisk, latLngToCell } from "h3-js";

// MapProvider interface: Phase 0 draws hex maps in SVG in the brand palette.
// A MapLibre/MapTiler implementation can be swapped in behind this type.
export interface MapProvider {
  id: string;
  hexBoundary(cell: string): [number, number][];
}

export const svgHexProvider: MapProvider = { id: "svg-hex", hexBoundary: (c) => cellToBoundary(c) as [number, number][] };

export function hexIds(lat: number, lng: number) {
  return { hex8: latLngToCell(lat, lng, 8), hex9: latLngToCell(lat, lng, 9) };
}

export function hexNeighbourhood(lat: number, lng: number, k = 4) {
  const centre = latLngToCell(lat, lng, 9);
  return gridDisk(centre, k);
}

export function hexCentre(cell: string): [number, number] {
  return cellToLatLng(cell) as [number, number];
}

export function hexOutline(cell: string): [number, number][] {
  return cellToBoundary(cell) as [number, number][];
}

/** Haversine distance in metres. Used for geofence checks (150 m check-in). */
export function distanceMetres(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
