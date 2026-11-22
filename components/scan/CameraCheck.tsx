// Part 2: live check before recording (key points visible, runner big enough in frame, camera side-on)
"use client";

import { useEffect, useRef } from "react";
import { checkCamera } from "@/lib/pose/camera-check";
import { say } from "@/lib/voice";
import type { LandmarkFrame } from "@/lib/types";

// The setup must pass (or fail) for this long without a break before "ready" changes.
// Passing: one lucky frame doesn't count. Failing: one jumpy frame mid-stride (loose clothing, blur) doesn't stop a recording.
const HOLD_MS = 1000;
// A spoken problem that still isn't fixed is said again after this long, in case the runner missed it.
const REPEAT_MS = 6000;

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
  const message = ok ? "" : problems.join(" ");
  const voice = useRef({ text: "", since: 0, spoken: "", spokenAt: 0 });
  useEffect(() => {
    const v = voice.current;
    const t = performance.now();
    if (message !== v.text) {
      v.text = message;
      v.since = t;
    }
    if (message === "") {
      if (v.spoken) say("Looks good, hold still."); // only after a problem was spoken, so it doesn't chatter
      v.spoken = "";
    } else if (t - v.since >= HOLD_MS && (message !== v.spoken || t - v.spokenAt >= REPEAT_MS)) {
      say(message); // same problem for 1 s: say it (again every 6 s until it's fixed)
      v.spoken = message;
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
