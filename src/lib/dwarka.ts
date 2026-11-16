// Dwarka pilot geo-fence: Sectors 6, 10, 12
// Polygon approx covering the three sectors (lat,lng)
export const DWARKA_POLYGON: [number, number][] = [
  [28.5855, 77.038],
  [28.5855, 77.065],
  [28.600, 77.065],
  [28.600, 77.038],
];

export function isInDwarka(lat: number, lng: number): boolean {
  // bounding box fast check
  if (lat < 28.58 || lat > 28.605 || lng < 77.035 || lng > 77.07) return false;
  // ray-casting point in polygon
  const poly = DWARKA_POLYGON;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export const DWARKA_SECTORS_LABEL = "Dwarka Sectors 6, 10, 12";
