// Part 1: the single entry point the rest of the app calls.
import type { LandmarkFrame, SessionMetrics } from "@/lib/types";
import { cadence, groundContactMs, groundContacts } from "./cadence.ts";
import { overstride, shinAngle } from "./overstride.ts";
import { elbowAngle, headOffset, maxThighAngle, torsoLean } from "./angles.ts";
import { verticalOscillation } from "./oscillation.ts";

/** heightCm: the runner's height from their profile, used to turn image distances into cm. */
export function analyze(frames: LandmarkFrame[], heightCm: number): SessionMetrics {
  // Scale x by width/height so x and y are the same units and angles come out true.
  const f = frames.map((fr) => ({ ...fr, landmarks: fr.landmarks.map((l) => ({ ...l, x: l.x * fr.aspect })) }));
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
