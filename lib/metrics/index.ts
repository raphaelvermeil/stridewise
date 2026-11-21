// Part 1: the single entry point the rest of the app calls.
import type { LandmarkFrame, SessionMetrics } from "@/lib/types";
import { cadence, groundContactMs, groundContacts } from "./cadence.ts";
import { overstride, shinAngle } from "./overstride.ts";

export function analyze(frames: LandmarkFrame[]): SessionMetrics {
  // Scale x by width/height so x and y are the same units and angles come out true.
  const f = frames.map((fr) => ({ ...fr, landmarks: fr.landmarks.map((l) => ({ ...l, x: l.x * fr.aspect })) }));
  const contacts = groundContacts(f);
  // TODO: filter low-visibility frames; thigh, torso, elbow, head metrics
  return {
    cadenceSpm: cadence(f).spm,
    maxThighAngleDeg: 0,
    overstrideRatio: overstride(f, contacts),
    torsoLeanDeg: 0,
    elbowAngleDeg: 0,
    headOffsetRatio: 0,
    shinAngleDeg: shinAngle(f, contacts),
    groundContactMs: groundContactMs(f, contacts),
  };
}
