// Part 2: live check before recording (key points visible, runner big enough in frame, camera side-on)
"use client";

import { useEffect, useRef } from "react";
import { checkCamera } from "@/lib/pose/camera-check";
import type { LandmarkFrame } from "@/lib/types";

// The setup must pass (or fail) for this long without a break before "ready" changes.
// Passing: one lucky frame doesn't count. Failing: one jumpy frame mid-stride (loose clothing, blur) doesn't stop a recording.
const HOLD_MS = 1000;

type Props = {
  frame: LandmarkFrame | null;
  onReady: (ready: boolean) => void; // tells the page when "ready" changes
};

export default function CameraCheck({ frame, onReady }: Props) {
  const since = useRef<number | null>(null); // when the current pass/fail streak started
  const lastOk = useRef(false);
  const ready = useRef(false);
  const { ok, problems } = checkCamera(frame);

  const now = performance.now();
  if (ok !== lastOk.current) since.current = now; // streak flipped
  lastOk.current = ok;
  since.current ??= now;
  if (now - since.current >= HOLD_MS) ready.current = ok;

  useEffect(() => onReady(ready.current));

  if (ready.current && ok) return <p className="font-medium text-green-600">✓ Camera set up correctly.</p>;
  if (ok) return <p className="text-amber-600">Looks good, hold still…</p>;
  return (
    <ul className="list-disc pl-5 text-red-600" aria-live="polite">
      {problems.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}
