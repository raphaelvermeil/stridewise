/**
 * Weighted form score (0–100) built on computeGoals().
 *
 * Weights reflect how strongly each metric is linked to tissue loading and
 * injury risk in the literature. Performance-only effects count for less.
 * They are expert-judgement weights, not fitted.
 */
import { computeGoals, type Goals, type Injury, type Runner } from "./computeGoals.ts";

export type Metric = keyof Goals;
export type Measured = Partial<Record<Metric, number>>;
export type GoalRange = { target: number; min: number; max: number };

export const BASE_WEIGHTS: Record<Metric, number> = {
  cadenceSpm:       30, // most-studied modifiable lever: +5–10% lowers knee/hip/tibial load; drives overstride too
  overstrideRatio:  15, // braking impulse and knee/tibial load; the mechanism cadence works through
  shinAngleDeg:     10, // touchdown geometry; overlaps overstride, so kept below it
  torsoLeanDeg:     10, // trade-off: more lean lowers knee (PFJ) stress but raises hip/hamstring/back load
  groundContactMs:  10, // strongly speed-dependent and device-noisy; mostly a performance marker
  maxThighAngleDeg:  8, // mainly performance (stride/knee drive); weak injury link
  headOffsetRatio:   7, // posture/neck strain; little running-injury evidence
  elbowAngleDeg:     5, // arm carriage barely affects lower-limb loading
  verticalOscillationCm: 5, // mainly running economy (wasted vertical work); weak injury link
};

/** Per-injury multipliers applied to the base weights before normalizing. */
const INJURY_MULT: Record<Injury, Partial<Record<Metric, number>>> = {
  knee:           { cadenceSpm: 1.3, overstrideRatio: 1.3, shinAngleDeg: 1.3, torsoLeanDeg: 1.2 },
  shin:           { cadenceSpm: 1.3, overstrideRatio: 1.3, shinAngleDeg: 1.3 },
  stressFracture: { cadenceSpm: 1.4, overstrideRatio: 1.3, shinAngleDeg: 1.3 },
  achilles:       { groundContactMs: 0.5, shinAngleDeg: 0.8 }, // don't reward short contact / forefoot
  plantarFascia:  { cadenceSpm: 1.2, groundContactMs: 0.7 },
  hamstring:      { overstrideRatio: 1.4, maxThighAngleDeg: 1.3, torsoLeanDeg: 1.3 },
  hip:            { cadenceSpm: 1.2, overstrideRatio: 1.2 },
  lowBack:        { torsoLeanDeg: 1.5, headOffsetRatio: 1.3 },
};

/** Metrics where being below target is fine (full marks down to the range min). */
const LOWER_IS_FINE = new Set<Metric>(["overstrideRatio", "shinAngleDeg"]);
/** Metrics where being above target is fine (full marks up to the range max, which rises with speed). */
const HIGHER_IS_FINE = new Set<Metric>(["cadenceSpm"]);

/**
 * How far past the range edge a value must be to score 0.
 * Roughly the 10th–90th percentile spread among healthy runners in the datasets
 * (RIC for cadence/GCT, FUK for shin/overstride/thigh); literature for the rest.
 */
const FALLOFF: Record<Metric, number> = {
  cadenceSpm: 20, overstrideRatio: 0.07, shinAngleDeg: 7, groundContactMs: 55,
  maxThighAngleDeg: 14, torsoLeanDeg: 8, headOffsetRatio: 0.08, elbowAngleDeg: 25,
  verticalOscillationCm: 4, // goal range 6–10 cm, so 0 at ≤2 cm or ≥14 cm
};

/**
 * 100 at target → 70 at the range edge → 0 at FALLOFF beyond the edge.
 * On a "fine" side: 100 all the way to the edge → 0 at FALLOFF beyond it (so e.g. a −15° shin isn't rewarded).
 * Either side of the target is scored against its own edge, so the score is asymmetric.
 */
function metricScore(m: Metric, v: number, g: GoalRange): number {
  const edge = v >= g.target ? g.max : g.min;
  const span = Math.abs(edge - g.target) || 1e-9;
  const d = Math.abs(v - g.target);
  const fine = (LOWER_IS_FINE.has(m) && v <= g.target) || (HIGHER_IS_FINE.has(m) && v >= g.target);
  if (fine) return d <= span ? 100 : Math.max(0, 100 - 100 * ((d - span) / FALLOFF[m]));
  if (d <= span) return 100 - 30 * (d / span);
  return Math.max(0, 70 - 70 * ((d - span) / FALLOFF[m]));
}

export function weightsFor(injuries: Injury[]): Record<Metric, number> {
  const w = { ...BASE_WEIGHTS };
  for (const i of injuries) for (const [m, k] of Object.entries(INJURY_MULT[i])) w[m as Metric] *= k!;
  return w;
}

/**
 * treadmillSpeedKmh: from the session. Cadence, contact time, shin, overstride and knee-drive goals all shift with speed.
 * goals: pass the user's own goals so the score matches the app's on-goal badges; defaults to computeGoals at this speed.
 */
export function scoreRun(
  runner: Runner,
  measured: Measured,
  treadmillSpeedKmh: number,
  goals: Record<Metric, GoalRange> = computeGoals({ ...runner, speedKmh: treadmillSpeedKmh }),
) {
  const w = weightsFor(runner.injuries);
  const parts = (Object.keys(BASE_WEIGHTS) as Metric[])
    .filter(m => measured[m] != null && Number.isFinite(measured[m]))
    .map(m => ({ metric: m, value: measured[m]!, score: metricScore(m, measured[m]!, goals[m]), weight: w[m] }));
  const totalW = parts.reduce((a, p) => a + p.weight, 0); // renormalize over metrics actually measured
  const score = parts.reduce((a, p) => a + p.score * p.weight, 0) / (totalW || 1);
  return {
    score: Math.round(score),
    breakdown: parts.map(p => ({ ...p, score: Math.round(p.score), weightPct: Math.round(100 * p.weight / totalW) })),
    goals,
  };
}
