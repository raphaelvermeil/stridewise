// Part 1: the single entry point the rest of the app calls.
import type { LandmarkFrame, MetricKey, MetricPoint, SessionMetrics } from "@/lib/types";
import { cadence, groundContactMs, groundContacts, median } from "./cadence.ts";
import { overstride, shinAngle } from "./overstride.ts";
import { elbowAngle, headOffset, maxThighAngle, torsoLean } from "./angles.ts";
import { verticalOscillation } from "./oscillation.ts";

const SMOOTH_STEPS = 5;

const FRAME_MS = 1000 / 30;

/**
 * 1. Keep at most one frame per 30 fps slot: the metrics count gaps and smoothing in frames, tuned at 30 fps.
 *    Live /scan frames arrive at the screen's refresh rate (60–120 Hz, mostly repeats of one camera frame),
 *    which made every wobble a new "step" (cadence 400–600). Slower sources pass through unchanged.
 * 2. Scale x by width/height so x and y are the same units and angles come out true.
 */
function toSquareUnits(frames: LandmarkFrame[]) {
  const kept: LandmarkFrame[] = [];
  for (const fr of frames) if (!kept.length || fr.t - kept[kept.length - 1].t >= FRAME_MS * 0.9) kept.push(fr);
  return kept.map((fr) => ({ ...fr, landmarks: fr.landmarks.map((l) => ({ ...l, x: l.x * fr.aspect })) }));
}

/** heightCm: the runner's height from their profile, used to turn image distances into cm. */
export function analyze(frames: LandmarkFrame[], heightCm: number): SessionMetrics {
  const f = toSquareUnits(frames);
  const contacts = groundContacts(f);
  // Low-visibility points are skipped inside each posture metric. Contacts/cadence use every frame,
  // since they compare neighbouring frames and gaps would break that.
  return {
    cadenceSpm: cadence(f).spm,
    maxThighAngleDeg: maxThighAngle(f, contacts),
    overstrideRatio: overstride(f, contacts),
    torsoLeanDeg: torsoLean(f),
    elbowAngleDeg: elbowAngle(f),
    headOffsetRatio: headOffset(f),
    shinAngleDeg: shinAngle(f, contacts),
    groundContactMs: groundContactMs(f, contacts),
    verticalOscillationCm: verticalOscillation(f, contacts, heightCm),
  };
}

/**
 * Every metric once per step (landing to next landing), smoothed with a 5-step rolling median,
 * for the end-of-session graph. Same calculations as analyze(), just applied one step at a time.
 */
export function analyzeOverTime(frames: LandmarkFrame[], heightCm: number): MetricPoint[] {
  const f = toSquareUnits(frames);
  const contacts = groundContacts(f);
  const steps = contacts.slice(0, -1).flatMap((c, k) => {
    const next = contacts[k + 1];
    if (next.start <= c.start) return []; // both feet detected landing on the same frame
    const step = f.slice(c.start, next.start);
    return [{
      t: f[c.start].t,
      cadenceSpm: 60000 / (f[next.start].t - f[c.start].t),
      maxThighAngleDeg: maxThighAngle(f, [c, next]),
      overstrideRatio: overstride(f, [c]),
      torsoLeanDeg: torsoLean(step),
      elbowAngleDeg: elbowAngle(step),
      headOffsetRatio: headOffset(step),
      shinAngleDeg: shinAngle(f, [c]),
      groundContactMs: groundContactMs(f, [c]),
      verticalOscillationCm: verticalOscillation(f, [c, next], heightCm),
    }];
  });

  // Centered rolling median: ignores up to 2 glitched steps out of 5, and skips steps with no value (NaN).
  // Fewer steps are used at the start and end.
  const half = Math.floor(SMOOTH_STEPS / 2);
  return steps.map((s, i) => {
    const near = steps.slice(Math.max(0, i - half), i + half + 1);
    const out = { ...s };
    for (const k of Object.keys(s) as (MetricKey | "t")[]) {
      if (k === "t") continue;
      const vals = near.map((p) => p[k]).filter(Number.isFinite);
      out[k] = vals.length ? median(vals) : NaN; // NaN = no data around this step → gap in the graph
    }
    return out;
  });
}
