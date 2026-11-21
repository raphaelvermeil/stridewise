// Part 1: the single entry point the rest of the app calls.
import type { LandmarkFrame, SessionMetrics } from "@/lib/types";

export function analyze(_frames: LandmarkFrame[]): SessionMetrics {
  // TODO: filter low-visibility frames, call cadence/angles/overstride, take medians over strides
  return {
    cadenceSpm: 0,
    maxThighAngleDeg: 0,
    overstrideRatio: 0,
    torsoLeanDeg: 0,
    elbowAngleDeg: 0,
    headOffsetRatio: 0,
  };
}
