// Part 2: live check before recording (key points visible, runner big enough in frame, camera side-on)
"use client";

import { useEffect, useRef } from "react";
import { checkCamera } from "@/lib/pose/camera-check";
import { say } from "@/lib/voice";
import type { LandmarkFrame } from "@/lib/types";

// The setup must pass (or fail) for this long without a break before "ready" changes.
// Passing: one lucky frame doesn't count. Failing: one jumpy frame mid-stride (loose clothing, blur) doesn't stop a recording.
const HOLD_MS = 1000;
// Voice: the runner gets this long to settle before a problem is spoken...
const SETTLE_MS = 3000;
// ...and after speaking, the voice stays quiet at least this long, whatever happens.
const QUIET_MS = 12000;

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

  // Speak the problems too, since the runner may be standing away from the screen.
  // Only the first problem, one short line at a time; the screen lists all of them.
  const problem = ok ? "" : problems[0];
  const voice = useRef({ failingSince: 0, spokenAt: -Infinity });
  useEffect(() => {
    const v = voice.current;
    const t = performance.now();
    if (!problem) {
      v.failingSince = 0; // passing again: the settle timer starts over next time
      return;
    }
    v.failingSince ||= t;
    if (t - v.failingSince >= SETTLE_MS && t - v.spokenAt >= QUIET_MS) {
      say(problem);
      v.spokenAt = t;
    }
  });

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
