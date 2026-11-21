// Part 1 + 2: decide if the camera placement is good enough to record.
import type { LandmarkFrame } from "@/lib/types";

export type CameraCheckResult = { ok: boolean; problems: string[] };

export function checkCamera(_frame: LandmarkFrame): CameraCheckResult {
  // TODO: key points visible, runner fills enough of frame, shoulders overlap (side-on)
  return { ok: false, problems: [] };
}
