// Part 2: setup instructions (camera distance, framing) in a large modal. A native <dialog> gives Escape-to-close and focus trapping.
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { btnPrimary } from "@/components/ui/styles";

const STEPS = [
  ["Camera side-on, at hip height", "Put the camera beside the treadmill, about 2–3 m away, pointing straight at your side."],
  ["Whole body in frame", "Head to feet must be in view, and you should fill at least half the frame's height."],
  ["Turn sideways", "Your side faces the camera, so your shoulders line up instead of both showing."],
  ["Good light, fitted clothes", "Baggy clothes and dim rooms hide your joints."],
  ["Then just run", "Enter your speed and get into position. When every check passes, a voice counts you in for 10 s to start the treadmill, then records 30 s on its own."],
];

// first: the automatic popup on arrival, which gets an X back to the dashboard. Reopened with "?", it only closes.
export default function ScanHelp({ onClose, first }: { onClose: () => void; first: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.showModal(), []);

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="scan-help-title"
      className="m-auto h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl overflow-hidden rounded-xl bg-surface p-2 text-ink shadow-lg backdrop:bg-ink/50 sm:h-[calc(100dvh-5rem)]">
      {/* The inner box scrolls, not the dialog, so the scrollbar sits inside the rounded corners instead of being cut off by them. */}
      <div className="flex h-full flex-col gap-8 overflow-y-auto p-4 scrollbar-thin sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="scan-help-title" className="text-h1">Set up your scan</h2>
          {first && (
            <Link href="/dashboard" aria-label="Back to dashboard"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-bg text-h4 transition duration-200 ease-out active:scale-[0.97]">✕</Link>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* shortcut: placeholder boxes until the real diagram and example image exist */}
          <figure className="flex aspect-video flex-col items-center justify-center rounded-lg bg-white shadow-xs">
            <figcaption className="text-body-sm text-muted">Diagram: camera distance and height</figcaption>
          </figure>
          <figure className="flex aspect-video flex-col items-center justify-center rounded-lg bg-white shadow-xs">
            <figcaption className="text-body-sm text-muted">Example: a well-framed runner</figcaption>
          </figure>
        </div>
        <ol className="grid gap-5 sm:grid-cols-2">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent font-bold tabular-nums">{i + 1}</span>
              <div>
                <h3 className="text-h4">{title}</h3>
                <p className="mt-1 text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <button onClick={() => ref.current?.close()} className={`${btnPrimary} mt-auto self-center`}>Got it, start the camera</button>
      </div>
    </dialog>
  );
}
