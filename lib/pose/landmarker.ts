// Part 1: create the MediaPipe PoseLandmarker (VIDEO mode) and turn video frames into LandmarkFrame[].
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { LandmarkFrame } from "@/lib/types";

// WASM version must match the installed @mediapipe/tasks-vision.
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task";
const FPS = 30;

let landmarker: Promise<PoseLandmarker> | null = null;

export function createLandmarker(): Promise<PoseLandmarker> {
  landmarker ??= FilesetResolver.forVisionTasks(WASM_URL).then((wasm) =>
    PoseLandmarker.createFromOptions(wasm, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numPoses: 1,
    }),
  );
  return landmarker;
}

/** Seeks through a loaded video at a fixed FPS so results are the same every run. */
export async function extractFrames(video: HTMLVideoElement): Promise<LandmarkFrame[]> {
  const pose = await createLandmarker();
  const frames: LandmarkFrame[] = [];
  for (let t = 0; t < video.duration * 1000; t += 1000 / FPS) {
    video.currentTime = t / 1000;
    await new Promise((r) => video.addEventListener("seeked", r, { once: true }));
    const landmarks = pose.detectForVideo(video, t).landmarks[0];
    if (landmarks) frames.push({ t, landmarks }); // no person detected -> skip frame
  }
  return frames;
}
