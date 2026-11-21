// Part 1: joint and segment angles (thigh, torso, elbow, head).
// Expects x already scaled by aspect (analyze() does this). "+" always means toward the runner's front.
import type { Landmark, LandmarkFrame } from "@/lib/types";
import { direction, LEGS, median, type Contact } from "./cadence.ts";

const MIN_VIS = 0.5; // MediaPipe visibility below this = point is guessed, not seen
const deg = (rad: number) => (rad * 180) / Math.PI;

/** Angle ABC in degrees (0..180), using x/y only since we work from a side view. */
export function angleAt(a: Landmark, b: Landmark, c: Landmark): number {
  const ab = Math.atan2(a.y - b.y, a.x - b.x);
  const cb = Math.atan2(c.y - b.y, c.x - b.x);
  const d = deg(Math.abs(ab - cb));
  return d > 180 ? 360 - d : d;
}

/** Upper-body points on the side facing the camera (the far arm is hidden, so its points are guesses). */
function nearSide(frames: LandmarkFrame[]) {
  const vis = (i: number) => median(frames.map((f) => f.landmarks[i].visibility));
  return vis(13) + vis(15) >= vis(14) + vis(16)
    ? { ear: 7, shoulder: 11, elbow: 13, wrist: 15, hip: 23 }
    : { ear: 8, shoulder: 12, elbow: 14, wrist: 16, hip: 24 };
}

/** Median of fn over frames where all the given points are visible. */
function overVisible(frames: LandmarkFrame[], points: number[], fn: (l: Landmark[]) => number): number {
  return median(frames.filter((f) => points.every((i) => f.landmarks[i].visibility >= MIN_VIS)).map((f) => fn(f.landmarks)));
}

/** Knee drive: per step, the highest thigh angle (hip→knee, from vertical) of either leg; median over steps. */
export function maxThighAngle(frames: LandmarkFrame[], contacts: Contact[]): number {
  const dir = direction(frames);
  const perStep = contacts.slice(1).flatMap((c, k) => {
    const angles = frames.slice(contacts[k].start, c.start).flatMap((f) =>
      LEGS.filter((leg) => f.landmarks[leg.knee].visibility >= MIN_VIS).map((leg) => {
        const [hip, knee] = [f.landmarks[leg.hip], f.landmarks[leg.knee]];
        return deg(Math.atan2((knee.x - hip.x) * dir, knee.y - hip.y));
      }),
    );
    return angles.length ? [Math.max(...angles)] : [];
  });
  return median(perStep);
}

/** Hip→shoulder line from vertical. + = leaning forward. */
export function torsoLean(frames: LandmarkFrame[]): number {
  const dir = direction(frames);
  const s = nearSide(frames);
  return overVisible(frames, [s.shoulder, s.hip], (l) =>
    deg(Math.atan2((l[s.shoulder].x - l[s.hip].x) * dir, l[s.hip].y - l[s.shoulder].y)),
  );
}

/** Shoulder–elbow–wrist angle on the near arm. shortcut: median over the whole swing; split front/back swing if needed. */
export function elbowAngle(frames: LandmarkFrame[]): number {
  const s = nearSide(frames);
  return overVisible(frames, [s.shoulder, s.elbow, s.wrist], (l) => angleAt(l[s.shoulder], l[s.elbow], l[s.wrist]));
}

/** Ear ahead of shoulder ÷ torso length (shoulder→hip). + = head forward. */
export function headOffset(frames: LandmarkFrame[]): number {
  const dir = direction(frames);
  const s = nearSide(frames);
  return overVisible(frames, [s.ear, s.shoulder, s.hip], (l) => {
    const torso = Math.hypot(l[s.shoulder].x - l[s.hip].x, l[s.shoulder].y - l[s.hip].y);
    return ((l[s.ear].x - l[s.shoulder].x) * dir) / torso;
  });
}
