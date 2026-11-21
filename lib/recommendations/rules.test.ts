import { test } from "node:test";
import assert from "node:assert/strict";
import { recommend } from "./rules.ts";

const m = { cadenceSpm: 160, maxThighAngleDeg: 45, overstrideRatio: 0.3, torsoLeanDeg: 6, elbowAngleDeg: 90, headOffsetRatio: 0, shinAngleDeg: 4, groundContactMs: 240 };

test("flags only metrics outside their goal, in the right direction", () => {
  const recs = recommend(m, [
    { metric: "cadenceSpm", min: 170, max: 180 }, // low
    { metric: "overstrideRatio", min: 0, max: 0.2 }, // high
    { metric: "torsoLeanDeg", min: 4, max: 10 }, // in range
  ]);
  assert.deepEqual(recs.map((r) => r.metric), ["cadenceSpm", "overstrideRatio"]);
  assert.match(recs[0].issue, /below/);
  assert.ok(recs.every((r) => r.cue && r.drills.length));
});

test("no advice when that direction has no rule", () => {
  assert.deepEqual(recommend({ ...m, overstrideRatio: -0.1 }, [{ metric: "overstrideRatio", min: 0, max: 0.2 }]), []);
});
