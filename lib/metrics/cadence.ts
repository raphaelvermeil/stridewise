// Part 1: steps per minute from the repeating ankle signal, plus foot-contact frame indices.
import type { LandmarkFrame } from "@/lib/types";

export function cadence(_frames: LandmarkFrame[]): { spm: number; contactFrames: number[] } {
  return { spm: 0, contactFrames: [] };
}
