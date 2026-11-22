// Display names and units for each metric, shared by the results table and charts.
import type { MetricKey } from "@/lib/types";
import { LEG_TO_HEIGHT } from "./oscillation.ts";

export const METRIC_LABELS: Record<MetricKey, { name: string; unit: string }> = {
  cadenceSpm: { name: "Cadence", unit: "steps/min" },
  overstrideRatio: { name: "Overstride (heel ahead of hip)", unit: "cm" },
  shinAngleDeg: { name: "Shin angle at landing", unit: "°" },
  torsoLeanDeg: { name: "Forward torso lean", unit: "°" },
  groundContactMs: { name: "Ground contact time", unit: "ms" },
  maxThighAngleDeg: { name: "Knee drive (peak thigh angle)", unit: "°" },
  headOffsetRatio: { name: "Head forward of shoulders", unit: "cm" },
  elbowAngleDeg: { name: "Elbow angle", unit: "°" },
  verticalOscillationCm: { name: "Vertical oscillation (bounce)", unit: "cm" },
};

// Ratio metrics shown in cm: × the body length they're a fraction of, estimated from height
// (Drillis & Contini: hip→ankle 0.491 × height, shoulder→hip 0.818 − 0.530 = 0.288 × height).
// Stored and scored as ratios, so dataset-based goals stay valid; the conversion is display-only.
const LENGTH_PER_HEIGHT: Partial<Record<MetricKey, number>> = {
  overstrideRatio: LEG_TO_HEIGHT,
  headOffsetRatio: 0.288,
};

/** Value in the unit shown in METRIC_LABELS. Apply to goals too, so they stay comparable. */
export function displayValue(metric: MetricKey, v: number, heightCm: number): number {
  const f = LENGTH_PER_HEIGHT[metric];
  return f ? v * f * heightCm : v;
}
