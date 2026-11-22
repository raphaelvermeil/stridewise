import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreRun } from "./scoreRun.ts";
import { computeGoals, type Runner } from "./computeGoals.ts";

const runner: Runner = { sex: "male", weightKg: 75, heightCm: 178, age: 30, fitness: "intermediate", injuries: [] };
const score = (metric: "cadenceSpm" | "shinAngleDeg" | "overstrideRatio", v: number, kmh = 10) =>
  scoreRun(runner, { [metric]: v }, kmh).breakdown[0].score;
const goal = (kmh: number) => computeGoals({ ...runner, speedKmh: kmh });

test("cadence above target gets full marks up to the range max", () => {
  const g = goal(10).cadenceSpm;
  assert.equal(score("cadenceSpm", g.target + 5), 100);
  assert.equal(score("cadenceSpm", g.max), 100);
  assert.ok(score("cadenceSpm", g.target - 5) < 100, "below target still costs points");
});

test("treadmill speed moves the cadence range: fast runners can step quicker, slow runners slower", () => {
  assert.ok(score("cadenceSpm", 180, 13) > score("cadenceSpm", 180, 10), "180 spm is better at 13 km/h than at 10");
  assert.ok(score("cadenceSpm", 155, 8) > score("cadenceSpm", 155, 10), "155 spm is better at 8 km/h than at 10");
});

test("shin and overstride: lower is fine only down to the goal min", () => {
  const g = goal(10);
  assert.equal(score("shinAngleDeg", g.shinAngleDeg.target - 3), 100);
  assert.equal(score("shinAngleDeg", -15), 0, "-15° shin is far past min, not rewarded");
  assert.equal(score("overstrideRatio", g.overstrideRatio.min), 100);
  assert.ok(score("overstrideRatio", -0.013) < 50, "foot far behind hip is not rewarded");
});

const scoreAt = (metric: "groundContactMs" | "torsoLeanDeg", v: number, kmh: number) =>
  scoreRun(runner, { [metric]: v }, kmh).breakdown[0].score;

test("faster runners aren't penalised for shorter contact or more lean; slower runners for the opposite", () => {
  // Values include the +60 ms measurement calibration in computeGoals.
  assert.ok(scoreAt("groundContactMs", 280, 14) > scoreAt("groundContactMs", 280, 10), "280 ms is better at 14 km/h");
  assert.ok(scoreAt("groundContactMs", 360, 7) > scoreAt("groundContactMs", 360, 10), "360 ms is better at 7 km/h");
  assert.ok(scoreAt("torsoLeanDeg", 12, 16) > scoreAt("torsoLeanDeg", 12, 10), "12° lean is better at 16 km/h");
  assert.ok(scoreAt("torsoLeanDeg", 4, 6) > scoreAt("torsoLeanDeg", 4, 10), "4° lean is better at 6 km/h");
  // Hitting the speed's own target scores 100 at any speed.
  for (const kmh of [7, 10, 14, 18]) {
    const g = computeGoals({ ...runner, speedKmh: kmh });
    assert.equal(scoreAt("groundContactMs", g.groundContactMs.target, kmh), 100);
    assert.equal(scoreAt("torsoLeanDeg", g.torsoLeanDeg.target, kmh), 100);
  }
});

test("passed-in goals replace the computed ones", () => {
  const goals = { ...goal(10), cadenceSpm: { target: 150, min: 145, max: 155, basis: "lit" as const } };
  assert.equal(scoreRun(runner, { cadenceSpm: 150 }, 10, goals).score, 100);
  assert.ok(scoreRun(runner, { cadenceSpm: 150 }, 10).score < 100, "default goals don't put 150 spm on target");
});
