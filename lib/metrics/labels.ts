// Display names and units for each metric, shared by the results table, charts, cards and goal editor.
import type { Goal, MetricKey, SessionMetrics } from "@/lib/types";
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

/** Inverse of displayValue: a number typed in the shown unit, back to what's stored. */
export function storedValue(metric: MetricKey, v: number, heightCm: number): number {
  const f = LENGTH_PER_HEIGHT[metric];
  return f ? v / (f * heightCm) : v;
}

/** A goal in display units, for bands and labels. On-goal checks use the stored values. */
export const displayGoal = (g: Goal, heightCm: number): Goal => ({
  ...g,
  min: displayValue(g.metric, g.min, heightCm),
  max: displayValue(g.metric, g.max, heightCm),
  target: g.target == null ? undefined : displayValue(g.metric, g.target, heightCm),
});

/** A display value as text: one decimal for small numbers (cm, degrees), whole numbers otherwise. */
export const formatMetric = (v: number) => (Math.abs(v) < 10 ? v.toFixed(1) : String(Math.round(v)));

export const inGoal = (v: number, g: Goal) => v >= g.min && v <= g.max;

/** How many of the goal metrics this scan landed inside. */
export const goalsMet = (m: SessionMetrics, goals: Goal[]) => goals.filter((g) => inGoal(m[g.metric], g)).length;

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
