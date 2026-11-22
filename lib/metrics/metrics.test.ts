import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { angleAt } from "./angles.ts";
import { cadence, groundContacts } from "./cadence.ts";
import { analyze, analyzeOverTime } from "./index.ts";

const clip1 = JSON.parse(readFileSync("fixtures/landmarks/2026-11-21_session-1.json", "utf8"));
const p = (x: number, y: number) => ({ x, y, z: 0, visibility: 1 });

test("angleAt", () => {
  assert.equal(Math.round(angleAt(p(1, 0), p(0, 0), p(0, 1))), 90);
  assert.equal(Math.round(angleAt(p(-1, 0), p(0, 0), p(1, 0))), 180);
  assert.equal(Math.round(angleAt(p(1, 1), p(0, 0), p(1, 0))), 45);
});

// clip1: 21.2 s side-view treadmill run, runner faces left. 62 steps per MediaPipe — TODO confirm with manual count.
test("cadence clip1", () => {
  const { spm, contactFrames } = cadence(clip1);
  assert.ok(Math.abs(spm - 180) <= 5, `spm ${spm}`);
  assert.ok(Math.abs(contactFrames.length - 62) <= 1, `steps ${contactFrames.length}`);
});

test("groundContacts clip1 finds one contact per step", () => {
  const n = groundContacts(clip1).length;
  assert.ok(Math.abs(n - 62) <= 2, `contacts ${n}`);
});

// Hand-checked in the video: 2nd step's foot is on the belt frames 9–17 (0-based).
test("groundContacts clip1 2nd step matches manual count", () => {
  const c = groundContacts(clip1)[1];
  assert.deepEqual([c.start, c.end], [9, 17]);
});

// Needs aspect; clip1.json predates it. Re-export clip1 from /dev/landmarks to enable.
test("analyze clip1 returns finite metrics", { skip: !clip1[0].aspect && "re-export clip1 with aspect" }, () => {
  const m = analyze(clip1, 180); // TODO: real height of the clip1 runner
  for (const [k, v] of Object.entries(m)) assert.ok(Number.isFinite(v) && v !== 0, `${k} = ${v}`);
  assert.ok(Math.abs(m.cadenceSpm - 180) <= 5);
});

test("analyzeOverTime clip1: one smoothed point per step, consistent with analyze", () => {
  const pts = analyzeOverTime(clip1, 180);
  const m = analyze(clip1, 180);
  assert.ok(Math.abs(pts.length - 61) <= 2, `points ${pts.length}`);
  assert.ok(pts.every((p, i) => i === 0 || p.t > pts[i - 1].t), "time increases");
  for (const k of Object.keys(m) as (keyof typeof m)[]) {
    const vals = pts.map((p) => p[k]);
    assert.ok(vals.every(Number.isFinite), `${k} finite`);
    const med = [...vals].sort((a, b) => a - b)[Math.floor(vals.length / 2)];
    assert.ok(Math.abs(med - m[k]) <= Math.abs(m[k]) * 0.15 + 1e-9, `${k}: series median ${med} vs analyze ${m[k]}`);
  }
});

test("analyzeOverTime ignores a step with missing posture points (no drop to 0)", () => {
  const steps = groundContacts(clip1);
  const [a, b] = [steps[20].start, steps[21].start];
  // Hide the near shoulder for one whole step.
  const hidden = clip1.map((f: any, i: number) =>
    i >= a && i < b ? { ...f, landmarks: f.landmarks.map((l: any, j: number) => (j === 11 ? { ...l, visibility: 0 } : l)) } : f,
  );
  const before = analyzeOverTime(clip1, 180)[20].torsoLeanDeg;
  const after = analyzeOverTime(hidden, 180)[20].torsoLeanDeg;
  assert.ok(Number.isFinite(after) && Math.abs(after - before) < 2, `torso ${before} -> ${after}`);
});

test("analyzeOverTime: one glitched step doesn't move the smoothed line", () => {
  const steps = groundContacts(clip1);
  const [a, b] = [steps[30].start, steps[31].start];
  // Fling the near shoulder far forward for one step (fake 60°+ lean).
  const glitch = clip1.map((f: any, i: number) =>
    i >= a && i < b ? { ...f, landmarks: f.landmarks.map((l: any, j: number) => (j === 11 ? { ...l, x: l.x - 0.3 } : l)) } : f,
  );
  const before = analyzeOverTime(clip1, 180).map((p) => p.torsoLeanDeg);
  const after = analyzeOverTime(glitch, 180).map((p) => p.torsoLeanDeg);
  for (let i = 28; i <= 32; i++) assert.ok(Math.abs(after[i] - before[i]) < 2, `step ${i}: ${before[i]} -> ${after[i]}`);
});

// /scan collects live frames at the screen's refresh rate (60–120 Hz), mostly repeats of one camera frame.
test("frames at 60/120 Hz give the same results as 30 fps", () => {
  const base = analyze(clip1, 180);
  const baseSeries = analyzeOverTime(clip1, 180);
  for (const hz of [60, 120]) {
    const k = hz / 30;
    const up = clip1.flatMap((f: any) => Array.from({ length: k }, (_, j) => ({ ...f, t: f.t + (j * 1000) / hz })));
    const m = analyze(up, 180);
    assert.equal(m.cadenceSpm, base.cadenceSpm, `${hz} Hz cadence`);
    assert.equal(m.groundContactMs, base.groundContactMs, `${hz} Hz contact`);
    const series = analyzeOverTime(up, 180);
    assert.equal(series.length, baseSeries.length, `${hz} Hz graph points`);
    assert.ok(series.every((p) => p.cadenceSpm < 260), `${hz} Hz graph cadence max ${Math.max(...series.map((p) => p.cadenceSpm))}`);
  }
});

test("graph cadence = steps ÷ time over 10 steps: steady on clip1", () => {
  const series = analyzeOverTime(clip1, 180).map((p) => p.cadenceSpm);
  const base = analyze(clip1, 180).cadenceSpm;
  // Away from the edges every point is within 10% of the session cadence: one stray landing in 10 steps.
  for (const v of series.slice(5, -5)) assert.ok(Math.abs(v - base) / base <= 0.1, `graph ${v.toFixed(0)} vs session ${base}`);
});
