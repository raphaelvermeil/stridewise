// Part 2: treadmill speed. The user can type km/h or mph; the rest of the app only ever sees km/h.
export type SpeedUnit = "kmh" | "mph";

const KM_PER_MILE = 1.609344;
export const MIN_KMH = 3; // brisk walk
export const MAX_KMH = 25; // fast sprint

export const asKmh = (value: number, unit: SpeedUnit) => (unit === "mph" ? value * KM_PER_MILE : value);
export const fromKmh = (kmh: number, unit: SpeedUnit) => (unit === "mph" ? kmh / KM_PER_MILE : kmh);

/** Typed speed -> km/h rounded to 0.1, or null if it is empty, not a number, or outside 3-25 km/h. */
export function toKmh(value: number, unit: SpeedUnit): number | null {
  const kmh = Math.round(asKmh(value, unit) * 10) / 10;
  return kmh >= MIN_KMH && kmh <= MAX_KMH ? kmh : null;
}
