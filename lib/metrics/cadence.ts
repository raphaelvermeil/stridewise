// Part 1: steps per minute from the repeating ankle signal, plus foot-contact frame indices.
import type { LandmarkFrame } from "@/lib/types";

const NOSE = 0, L_HIP = 23, R_HIP = 24, L_ANKLE = 27, R_ANKLE = 28;

export const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

/** MediaPipe indices for each leg. Labels can swap between frames, but each leg's points swap together. */
export const LEGS = [
  { hip: 23, knee: 25, ankle: 27, heel: 29, toe: 31 },
  { hip: 24, knee: 26, ankle: 28, heel: 30, toe: 32 },
];
export type Leg = (typeof LEGS)[number];
/** One foot on the belt, from first to last frame index (inclusive). */
export type Contact = { leg: Leg; start: number; end: number };

/** +1 if the runner faces right (toward larger x), -1 if facing left. */
export function direction(frames: LandmarkFrame[]): number {
  return median(frames.map((f) => f.landmarks[NOSE].x - f.landmarks[L_HIP].x)) > 0 ? 1 : -1;
}

/**
 * Frames where one foot is furthest ahead of its hip (~foot contact).
 * shortcut: peak "foot ahead" lands a frame or two before true contact; refine with ankle height if overstride looks off.
 */
function legContacts(frames: LandmarkFrame[], ankle: number, hip: number, dir: number): number[] {
  const ahead = frames.map((f) => (f.landmarks[ankle].x - f.landmarks[hip].x) * dir);
  // shortcut: 5-frame smoothing assumes ~30 fps (what extractFrames produces).
  const s = ahead.map((_, i) => {
    const w = ahead.slice(Math.max(0, i - 2), i + 3);
    return w.reduce((a, b) => a + b) / w.length;
  });
  const out: number[] = [];
  for (let i = 1; i < s.length - 1; i++) {
    const isPeak = s[i] > s[i - 1] && s[i] >= s[i + 1] && s[i] > 0;
    if (isPeak && (!out.length || frames[i].t - frames[out.at(-1)!].t >= 250)) out.push(i);
  }
  return out;
}

export function cadence(frames: LandmarkFrame[]): { spm: number; contactFrames: number[] } {
  const dir = direction(frames);
  // Both legs merged: MediaPipe swaps left/right in side view, which breaks a single-leg count
  // but leaves the merged sequence of landings intact.
  const all = [...legContacts(frames, L_ANKLE, L_HIP, dir), ...legContacts(frames, R_ANKLE, R_HIP, dir)].sort(
    (a, b) => a - b,
  );
  const contactFrames: number[] = [];
  for (const i of all) {
    if (!contactFrames.length || frames[i].t - frames[contactFrames.at(-1)!].t >= 150) contactFrames.push(i);
  }
  // Median step time, so the odd glitched gap doesn't skew the result.
  const gaps = contactFrames.slice(1).map((i, k) => frames[i].t - frames[contactFrames[k]].t);
  return { spm: gaps.length ? Math.round(60000 / median(gaps)) : 0, contactFrames };
}

/**
 * A foot is on the belt when it is near belt height AND the belt is carrying it backward AND it isn't lifting off.
 * Height alone is too noisy (foot y wobbles ~1% while planted).
 */
export function groundContacts(frames: LandmarkFrame[]): Contact[] {
  const dir = direction(frames);
  const footY = (f: LandmarkFrame, leg: Leg) => Math.max(f.landmarks[leg.heel].y, f.landmarks[leg.toe].y);
  const belt = median(frames.map((f) => Math.max(footY(f, LEGS[0]), footY(f, LEGS[1]))));
  const legLen = median(frames.map((f) => f.landmarks[LEGS[0].ankle].y - f.landmarks[LEGS[0].hip].y));
  const out: Contact[] = [];
  for (const leg of LEGS) {
    const footX = frames.map((f) => (f.landmarks[leg.heel].x + f.landmarks[leg.toe].x) / 2);
    let start = -1;
    let last = -10;
    const close = () => last - start >= 2 && out.push({ leg, start, end: last }); // drop 1–2 frame blips
    for (let i = 1; i < frames.length - 1; i++) {
      const low = footY(frames[i], leg) > belt - 0.12 * legLen;
      const backward = (footX[i + 1] - footX[i - 1]) * dir < 0;
      // Lift-off: belt height varies with perspective, so a rising toe can still look "low". Planted feet move <~3%/frame.
      const rising = footY(frames[i - 1], leg) - footY(frames[i], leg) > 0.04 * legLen;
      if (!low || !backward || rising) continue;
      // Gaps of 1–2 frames are heel-to-toe roll noise, not a new step.
      if (i - last > 3) {
        if (start >= 0) close();
        start = i;
      }
      last = i;
    }
    if (start >= 0) close();
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Median contact duration. shortcut: ±1 frame (33 ms at 30 fps) per step; export at 60 fps if this needs to be sharper. */
export function groundContactMs(frames: LandmarkFrame[], contacts: Contact[]): number {
  const frameMs = median(frames.slice(1).map((f, i) => f.t - frames[i].t));
  // +1 frame: true touchdown/toe-off fall somewhere inside the frame before/after the detected run.
  return Math.round(median(contacts.map((c) => frames[c.end].t - frames[c.start].t + frameMs)));
}
