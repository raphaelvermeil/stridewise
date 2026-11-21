// Part 2: transparent <canvas> over the <video>, redraws the skeleton each frame
"use client";

import { useEffect, useRef } from "react";
import { DrawingUtils, PoseLandmarker } from "@mediapipe/tasks-vision";
import { createLandmarker } from "@/lib/pose/landmarker";

export default function PoseOverlay({ video }: { video: HTMLVideoElement | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!video) return;
    let frameId = 0;
    let stopped = false;
    let lastTime = -1;

    createLandmarker().then((pose) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const draw = new DrawingUtils(ctx);

      const loop = () => {
        if (stopped) return;
        // Only detect when the video shows a new frame, so a paused video keeps its skeleton.
        if (video.readyState >= 2 && video.currentTime !== lastTime) {
          lastTime = video.currentTime;
          canvas.width = video.videoWidth; // resizing also clears the canvas
          canvas.height = video.videoHeight;
          // shortcut: performance.now() keeps timestamps increasing for MediaPipe; switch to video time once Part 1 needs frame-accurate results here.
          const landmarks = pose.detectForVideo(video, performance.now()).landmarks[0];
          if (landmarks) {
            draw.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: "#22c55e", lineWidth: 3 });
            draw.drawLandmarks(landmarks, { color: "#ef4444", radius: 3 });
          }
        }
        frameId = requestAnimationFrame(loop);
      };
      loop();
    });

    return () => {
      stopped = true;
      cancelAnimationFrame(frameId);
    };
  }, [video]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}
