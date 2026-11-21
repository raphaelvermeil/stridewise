// Part 1: vertical oscillation — how much the hips rise and fall each step, in cm.
// Expects x already scaled by aspect (analyze() does this), so x and y are in the same units.
import type { Landmark, LandmarkFrame } from "@/lib/types";
import { LEGS, median, type Contact } from "./cadence.ts";

// Hip-joint height minus ankle height, as a share of standing height (Drillis & Contini: 0.530 − 0.039).
const LEG_TO_HEIGHT = 0.491;
const L_HIP = 23, R_HIP = 24;

const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);

/** Median per-step hip bounce (highest minus lowest hip point between two landings), in cm. */
export function verticalOscillation(frames: LandmarkFrame[], contacts: Contact[], heightCm: number): number {
  // Scale from the near leg: thigh + shin length doesn't change with knee bend or lean, unlike standing height.
  const vis = (i: number) => median(frames.map((f) => f.landmarks[i].visibility));
  const leg = vis(LEGS[0].knee) >= vis(LEGS[1].knee) ? LEGS[0] : LEGS[1];
  const legLen = median(frames.map(({ landmarks: l }) => dist(l[leg.hip], l[leg.knee]) + dist(l[leg.knee], l[leg.ankle])));
  const cmPerUnit = heightCm / (legLen / LEG_TO_HEIGHT);

  // Hip midpoint height, smoothed over 3 frames so MediaPipe jitter doesn't inflate the max − min.
  const hipY = frames.map((f) => (f.landmarks[L_HIP].y + f.landmarks[R_HIP].y) / 2);
  const smooth = hipY.map((_, i) => (hipY[Math.max(0, i - 1)] + hipY[i] + hipY[Math.min(hipY.length - 1, i + 1)]) / 3);

  const perStep = contacts.slice(1).flatMap((c, k) => {
    const w = smooth.slice(contacts[k].start, c.start + 1);
    return w.length >= 3 ? [(Math.max(...w) - Math.min(...w)) * cmPerUnit] : [];
  });
  return median(perStep);
}
