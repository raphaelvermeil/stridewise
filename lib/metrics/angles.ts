// Part 1: joint and segment angles (thigh, torso, elbow, head).
import type { Landmark } from "@/lib/types";

/** Angle ABC in degrees (0..180), using x/y only since we work from a side view. */
export function angleAt(a: Landmark, b: Landmark, c: Landmark): number {
  const ab = Math.atan2(a.y - b.y, a.x - b.x);
  const cb = Math.atan2(c.y - b.y, c.x - b.x);
  const deg = Math.abs(ab - cb) * (180 / Math.PI);
  return deg > 180 ? 360 - deg : deg;
}
