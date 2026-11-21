// Part 1 + 2: decide if the camera placement is good enough to record.
import type { LandmarkFrame } from "@/lib/types";

export type CameraCheckResult = { ok: boolean; problems: string[] };

// MediaPipe point numbers, as [left, right] pairs.
const NOSE = 0;
const BODY = { shoulders: [11, 12], hips: [23, 24], knees: [25, 26], ankles: [27, 28] };

// Stricter than MediaPipe's usual 0.5, so points it is only guessing (hidden by baggy clothes, blur, objects) fail.
const MIN_VISIBILITY = 0.7;
// Nose to ankle must cover at least half the frame height.
const MIN_BODY_HEIGHT = 0.5;
// Gap between the shoulders / torso length. Side-on is near 0; facing the camera is about 0.7.
const MAX_SHOULDER_GAP = 0.3;

export function checkCamera(frame: LandmarkFrame | null): CameraCheckResult {
  if (!frame) return { ok: false, problems: ["We can't see anyone. Step into view."] };
  const p = frame.landmarks;
  const seen = (i: number) =>
    p[i].visibility >= MIN_VISIBILITY && p[i].x >= 0 && p[i].x <= 1 && p[i].y >= 0 && p[i].y <= 1;

  // 1. Whole body: the head, plus at least one of each pair. In a side view the far limb is often hidden.
  const missing = Object.entries(BODY)
    .filter(([, [left, right]]) => !seen(left) && !seen(right))
    .map(([name]) => name);
  if (!seen(NOSE)) missing.unshift("head");
  if (missing.length) {
    return { ok: false, problems: [`We can't clearly see your ${missing.join(", ")}. Make sure your whole body is in view.`] };
  }

  const problems: string[] = [];

  // 2. Big enough: nose to the lowest visible ankle.
  const ankleY = Math.max(...BODY.ankles.filter(seen).map((i) => p[i].y));
  if (ankleY - p[NOSE].y < MIN_BODY_HEIGHT) problems.push("You look too small. Move the camera closer.");

  // 3. Side-on: shoulders overlap. x is scaled by the frame's width/height so it is in the same units as y.
  const shoulderGap = Math.abs(p[11].x - p[12].x) * frame.aspect;
  const torso = Math.abs((p[23].y + p[24].y) / 2 - (p[11].y + p[12].y) / 2);
  if (shoulderGap / torso > MAX_SHOULDER_GAP) problems.push("Turn sideways so your side faces the camera.");

  return { ok: problems.length === 0, problems };
}
