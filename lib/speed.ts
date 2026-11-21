// Part 2: treadmill speed. The user can type a speed (km/h, mph) or a pace (min/km, min/mile);
// the rest of the app only ever sees km/h.
export type SpeedUnit = "kmh" | "mph" | "minkm" | "minmi";

export const UNIT_LABELS: Record<SpeedUnit, string> = {
  kmh: "km/h",
  mph: "mph",
  minkm: "min/km",
  minmi: "min/mile",
};

const KM_PER_MILE = 1.609344;
export const MIN_KMH = 3; // brisk walk
export const MAX_KMH = 25; // fast sprint

export const isPace = (unit: SpeedUnit) => unit === "minkm" || unit === "minmi";

/** A value in `unit` -> km/h. Pace values are minutes (5.5 = 5:30). */
export function asKmh(value: number, unit: SpeedUnit): number {
  if (unit === "mph") return value * KM_PER_MILE;
  if (unit === "minkm") return 60 / value;
  if (unit === "minmi") return (60 / value) * KM_PER_MILE;
  return value;
}

/** km/h -> a value in `unit`. */
export function fromKmh(kmh: number, unit: SpeedUnit): number {
  if (unit === "mph") return kmh / KM_PER_MILE;
  if (unit === "minkm") return 60 / kmh;
  if (unit === "minmi") return 60 / (kmh / KM_PER_MILE);
  return kmh;
}

/** What the user typed -> a number in `unit`. Pace can be typed as "5:30" or "5.5". */
export function parse(text: string, unit: SpeedUnit): number {
  const mmss = isPace(unit) && text.match(/^(\d+):([0-5]\d)$/);
  return mmss ? Number(mmss[1]) + Number(mmss[2]) / 60 : Number(text);
}

/** A number in `unit` -> text for the box: "10.5" for speeds, "5:30" for paces. */
export function format(value: number, unit: SpeedUnit): string {
  if (!isPace(unit)) return String(Math.round(value * 10) / 10);
  const seconds = Math.round(value * 60);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** What the user typed -> km/h rounded to 0.1, or null if empty, not a number, or outside 3-25 km/h. */
export function toKmh(text: string, unit: SpeedUnit): number | null {
  const kmh = Math.round(asKmh(parse(text, unit), unit) * 10) / 10;
  return kmh >= MIN_KMH && kmh <= MAX_KMH ? kmh : null;
}

/** The 3-25 km/h range written in `unit`, rounded inward so both ends are allowed: "1.9-15.5", "2:24-20:00". */
export function rangeText(unit: SpeedUnit): string {
  const step = isPace(unit) ? 1 / 60 : 0.1; // paces to the second, speeds to 0.1
  const [a, b] = [fromKmh(MIN_KMH, unit), fromKmh(MAX_KMH, unit)].sort((x, y) => x - y); // pace runs backwards
  const lo = Math.ceil(a / step - 1e-9) * step;
  const hi = Math.floor(b / step + 1e-9) * step;
  return `${format(lo, unit)}–${format(hi, unit)}`;
}
