/**
 * Haversine formula — returns the great-circle distance in **kilometres**
 * between two points on the Earth's surface.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const valid = (n: number) => typeof n === 'number' && Number.isFinite(n);
  if (!valid(lat1) || !valid(lng1) || !valid(lat2) || !valid(lng2)) {
    return Number.NaN;
  }
  const R = 6_371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format a distance in km to a human-readable string.
 * < 1 km → "850 m" | 1–100 km → "3,2 km" | > 100 km → "4 623 km"
 */
export function formatDistance(km: number): string {
  if (typeof km !== 'number' || !Number.isFinite(km) || km < 0) {
    return '—';
  }
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km >= 100) {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(km))} km`;
  }
  return `${km.toFixed(1).replace('.', ',')} km`;
}
