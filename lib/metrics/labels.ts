// Display name and unit for each metric, shared by the goal editor, charts and result cards.
import type { Goal, MetricKey, SessionMetrics } from "@/lib/types";

export const METRIC_LABELS: Record<MetricKey, { name: string; unit: string }> = {
  cadenceSpm: { name: "Cadence", unit: "spm" },
  maxThighAngleDeg: { name: "Knee drive", unit: "°" },
  overstrideRatio: { name: "Overstride", unit: "× leg" },
  torsoLeanDeg: { name: "Torso lean", unit: "°" },
  elbowAngleDeg: { name: "Elbow angle", unit: "°" },
  headOffsetRatio: { name: "Head position", unit: "× torso" },
  shinAngleDeg: { name: "Shin angle", unit: "°" },
  groundContactMs: { name: "Ground contact", unit: "ms" },
  verticalOscillationCm: { name: "Vertical oscillation", unit: "cm" },
};

/** Ratios need decimals; everything else reads fine as a whole number. */
export const formatMetric = (metric: MetricKey, v: number) => (metric.endsWith("Ratio") ? v.toFixed(2) : String(Math.round(v)));

export const inGoal = (v: number, g: Goal) => v >= g.min && v <= g.max;

/** How many of the goal metrics this scan landed inside. */
export const goalsMet = (m: SessionMetrics, goals: Goal[]) => goals.filter((g) => inGoal(m[g.metric], g)).length;

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
