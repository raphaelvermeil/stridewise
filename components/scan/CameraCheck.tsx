// Part 2: live check before recording (key points visible, runner big enough in frame, camera side-on)
"use client";

import { useRef } from "react";
import { checkCamera } from "@/lib/pose/camera-check";
import type { LandmarkFrame } from "@/lib/types";

// The setup must pass for this long without a break, so one lucky frame (or one jumpy frame from loose clothing) doesn't count.
const HOLD_MS = 1000;

export default function CameraCheck({ frame }: { frame: LandmarkFrame | null }) {
  const passingSince = useRef<number | null>(null);
  const { ok, problems } = checkCamera(frame);

  if (!ok) passingSince.current = null;
  else passingSince.current ??= frame!.t;
  const ready = ok && frame!.t - passingSince.current! >= HOLD_MS;

  if (ready) return <p className="font-medium text-green-600">✓ Camera set up correctly. Ready to record.</p>;
  if (ok) return <p className="text-amber-600">Looks good, hold still…</p>;
  return (
    <ul className="list-disc pl-5 text-red-600" aria-live="polite">
      {problems.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}
