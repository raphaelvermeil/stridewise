// Part 1: create the MediaPipe PoseLandmarker (VIDEO mode) and turn video frames into LandmarkFrame[].
import type { LandmarkFrame } from "@/lib/types";

export async function createLandmarker(): Promise<unknown> {
  // TODO: PoseLandmarker.createFromOptions(...) from @mediapipe/tasks-vision
  return null;
}

export async function extractFrames(_video: HTMLVideoElement): Promise<LandmarkFrame[]> {
  // TODO
  return [];
}
