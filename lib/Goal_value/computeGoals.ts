/**
 * Running-form goal model, v2: coefficients fitted to open datasets.
 *
 * Data sources (see README.md for metric definitions and methods):
 *   RIC = Running Injury Clinic, Ferber et al. 2024. 397 healthy runners for the
 *         regressions, 1,227 runners in total (injured included).
 *   FUK = Fukuchi et al. 2017. 39 runners on a force-plate treadmill at
 *         9, 12.6 and 16.2 km/h.
 *
 * How goals are set:
 *   - Each metric starts from the healthy-population value predicted for this
 *     runner's speed and body.
 *   - Shin angle and overstride targets are set to the 25th percentile
 *     ("better than typical"), with the 75th percentile as the max.
 *   - Prescriptive nudges (injury, high BMI) come from clinical literature,
 *     not from these datasets. They are marked [lit] below.
 */

import type { MetricKey } from "@/lib/types";

export type Sex = "male" | "female";
export type Fitness = "beginner" | "intermediate" | "advanced" | "elite";
export type Injury =
  | "knee" | "shin" | "stressFracture" | "achilles"
  | "plantarFascia" | "hamstring" | "hip" | "lowBack";

export interface Runner {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  fitness: Fitness;
  injuries: Injury[];
  /** Speed the measurement was taken at. Strongly recommended. */
  speedKmh?: number;
  /** Runner's measured cadence. Enables a progressive (+5–10%) cadence goal. */
  currentCadenceSpm?: number;
}

export type Basis = "data" | "data+lit" | "lit";
export interface Range { target: number; min: number; max: number; basis: Basis }
/** One goal per metric analyze() returns; adding a metric there forces a goal here. */
export type Goals = Record<MetricKey, Range>;

const r = (v: number, d = 0) => Math.round(v * 10 ** d) / 10 ** d;

/**
 * Fitness has no effect on cadence or GCT once speed is accounted for
 * (RIC: competitive vs recreational, p > 0.19). It is only used to guess an
 * easy-pace speed when none is given.
 */
const DEFAULT_EASY_KMH: Record<Fitness, number> = {
  beginner: 8.5, intermediate: 10, advanced: 11.5, elite: 13.5,
};

/** Prescriptive adjustments [lit]. */
export const INJURY: Record<Injury, Partial<{
  cad: number; gct: number; thighMax: number; overMax: number;
  shinMax: number; torso: number; torsoMax: number; headMax: number;
}>> = {
  // RIC: knee and shin-injured runners run with +5–6 ms GCT and shin -1.8 spm
  // cadence vs healthy runners (adjusted). This supports nudging cadence up.
  knee:           { cad: +3, overMax: -0.015, shinMax: -1.5 },
  shin:           { cad: +3, overMax: -0.015, shinMax: -1.5 },
  stressFracture: { cad: +4, overMax: -0.015, shinMax: -1.5 },
  achilles:       { cad: +1, gct: +10, shinMax: +1 },   // don't force forefoot / short GCT
  plantarFascia:  { cad: +2, gct: +5 },
  hamstring:      { overMax: -0.015, thighMax: -3, torsoMax: -2 },
  hip:            { cad: +3, overMax: -0.01 },
  lowBack:        { torso: -1, torsoMax: -2, headMax: -0.02 },
};

export function computeGoals(p: Runner): Goals {
  const kmh = p.speedKmh ?? DEFAULT_EASY_KMH[p.fitness];
  const dv = kmh - 10;
  const bmi = p.weightKg / (p.heightCm / 100) ** 2;
  const female = p.sex === "female" ? 1 : 0;

  const inj = p.injuries.reduce((a, i) => {
    for (const [k, v] of Object.entries(INJURY[i])) a[k] = (a[k] ?? 0) + (v as number);
    return a;
  }, {} as Record<string, number>);
  const injCad = Math.min(inj.cad ?? 0, 5);
  // Caps (like cadence's) so stacked injuries can't push a max below its target.
  const injShinMax = Math.max(inj.shinMax ?? 0, -3);
  const injOverMax = Math.max(inj.overMax ?? 0, -0.025);
  const injTorsoMax = Math.max(inj.torsoMax ?? 0, -2);

  // ---- Cadence (RIC healthy OLS, R² = 0.25) ----
  // At 10 km/h, 172 cm, BMI 23, age 39 the typical cadence is 167 spm.
  // Sex has no effect once height is included (p = 0.8).
  const cadTypical =
    167
    + 2.95 * dv                  // FUK within-subject slope: 2.75
    - 0.39 * (p.heightCm - 172)
    - 0.35 * (bmi - 23)          // heavier runners naturally step slower...
    + 0.11 * (p.age - 39);
  let cad =
    cadTypical
    + Math.min(0.5 * Math.max(0, bmi - 25), 4)  // ...but a higher cadence is advised to cut load [lit]
    + injCad;                                   // [lit]
  if (p.currentCadenceSpm && p.currentCadenceSpm < cad) {
    cad = Math.min(cad, p.currentCadenceSpm * 1.075); // progressive: +5–10% max [lit]
  }

  // ---- Ground contact time ----
  // Level from the FUK force plate: 257 ms at 10 km/h for a 177 cm, BMI 22 runner.
  // Coefficients from RIC healthy OLS (R² = 0.36). The speed slope agrees with FUK (-9.8).
  // Age has no effect (p = 0.38) and fitness has no effect after speed.
  const gct =
    257
    - 10.4 * dv
    + 1.1 * (p.heightCm - 177)
    + 2.35 * (bmi - 22)
    + 14 * female                // RIC p < 0.001; not significant in the smaller FUK sample
    + (inj.gct ?? 0);

  // ---- Shin angle at touchdown (FUK) ----
  // Median 7.2° at 10 km/h, +0.66° per km/h. Target = 25th percentile, max = 75th.
  const shinMed = 7.2 + 0.66 * dv;

  // ---- Overstride ratio (FUK) ----
  // Median 0.21 at 10 km/h, +0.011 per km/h. Nobody in the data was below 0.13.
  const overMed = 0.209 + 0.011 * dv;

  // ---- Peak thigh angle (FUK) ----
  // Median 30° at 10 km/h, +1.7° per km/h. No height or age effect.
  const thigh = 30.2 + 1.7 * dv;

  // ---- Torso lean, elbow, head: no public dataset; literature defaults ----
  // Runners lean more as they speed up, so the whole range (not just the target) shifts with speed.
  const torsoSpeed = 0.3 * dv;
  const torso = 7 + torsoSpeed + (inj.torso ?? 0);

  return {
    cadenceSpm:       { target: r(cad), min: r(cad - 5), max: r(cad + 10), basis: "data+lit" },
    groundContactMs:  { target: r(gct), min: r(gct - 25), max: r(gct + 15), basis: "data" },
    shinAngleDeg:     { target: r(shinMed - 1.6, 1), min: -2,
                        max: r(shinMed + 1.7 + injShinMax, 1), basis: "data" },
    overstrideRatio:  { target: r(overMed - 0.013, 3), min: r(overMed - 0.06, 3),
                        max: r(overMed + 0.017 + injOverMax, 3), basis: "data" },
    maxThighAngleDeg: { target: r(thigh), min: r(thigh - 6.5),
                        max: r(thigh + 7 + (inj.thighMax ?? 0)), basis: "data" },
    torsoLeanDeg:     { target: r(torso, 1), min: r(3 + torsoSpeed, 1),
                        max: r(11 + torsoSpeed + injTorsoMax, 1), basis: "lit" },
    elbowAngleDeg:    { target: 90, min: 75, max: 105, basis: "lit" },
    headOffsetRatio:  { target: 0, min: -0.03, max: r(0.06 + (inj.headMax ?? 0), 3), basis: "lit" },
    // shortcut: fixed literature range (typical recreational 6–10 cm), not personalised; fit to data if one turns up.
    verticalOscillationCm: { target: 8, min: 6, max: 10, basis: "lit" },
  };
}
