// Part 1: foot strike position at each foot contact — overstride ratio and shin angle.
// Expects x already scaled by aspect (analyze() does this), so x and y are in the same units.
import type { Landmark, LandmarkFrame } from "@/lib/types";
import { direction, median, type Contact } from "./cadence.ts";

const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);

/** Median of (heel ahead of hip) / leg length at touchdown. Hip = center-of-mass proxy. + = heel ahead. */
export function overstride(frames: LandmarkFrame[], contacts: Contact[]): number {
  const dir = direction(frames);
  return median(
    contacts.map(({ leg, start }) => {
      const l = frames[start].landmarks;
      const legLen = dist(l[leg.hip], l[leg.knee]) + dist(l[leg.knee], l[leg.ankle]);
      return ((l[leg.heel].x - l[leg.hip].x) * dir) / legLen;
    }),
  );
}

/** Median shin angle from vertical at touchdown, in degrees. + = ankle ahead of knee. */
export function shinAngle(frames: LandmarkFrame[], contacts: Contact[]): number {
  const dir = direction(frames);
  return median(
    contacts.map(({ leg, start }) => {
      const l = frames[start].landmarks;
      return (Math.atan2((l[leg.ankle].x - l[leg.knee].x) * dir, l[leg.ankle].y - l[leg.knee].y) * 180) / Math.PI;
    }),
  );
}
