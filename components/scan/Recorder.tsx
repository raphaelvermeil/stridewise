// Part 2: once the runner is in position, a voice prompt, a spoken 10 s countdown, then a 30 s recording that starts and stops on its own.
// If the camera check fails before or during the recording, the take is thrown away and it starts over once the runner is back in position.
"use client";

import { useEffect, useRef, useState } from "react";
import { say } from "@/lib/voice";
import type { LandmarkFrame } from "@/lib/types";

const COUNTDOWN_S = 10;
const RECORD_S = 30;

// announcing: the "position reached" message is being spoken; the countdown starts when it finishes.
type Phase = "waiting" | "announcing" | "countdown" | "recording" | "done";
const ACTIVE: Phase[] = ["announcing", "countdown", "recording"]; // phases a failed camera check interrupts

type Props = {
  ready: boolean; // camera check passing and a valid speed is entered
  stream: MediaStream | null; // the live webcam feed to record
  frame: LandmarkFrame | null; // latest live landmarks from PoseOverlay, collected while recording
  onDone: (video: Blob, frames: LandmarkFrame[]) => void; // must not change between renders, or the timer restarts
};

export default function Recorder({ ready, stream, frame, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const frames = useRef<LandmarkFrame[]>([]);
  const startedAt = useRef(0); // performance.now() when recording started, so frame t = ms into the video
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [disrupted, setDisrupted] = useState(false);

  // 1. Waiting -> announcing, the moment the runner is in position (first time, or back after a disruption).
  useEffect(() => {
    if (phase !== "waiting" || !ready) return;
    setDisrupted(false);
    setPhase("announcing");
  }, [phase, ready]);

  // 2. Speak the message, then start the countdown once it has finished, so the voice never talks over the numbers.
  useEffect(() => {
    if (phase !== "announcing") return;
    let cancelled = false;
    say("Position reached correctly. Start the treadmill. Recording starts in ten seconds.").then(() => {
      // Only move on if nothing else changed the phase meanwhile (a disruption cancels the speech, which also "finishes" it).
      if (!cancelled) setPhase((p) => (p === "announcing" ? "countdown" : p));
    });
    return () => {
      cancelled = true; // disrupted mid-message: don't start the countdown
    };
  }, [phase]);

  // 3. Disrupted: a check failed before or during the recording -> back to waiting.
  useEffect(() => {
    if (ready || !ACTIVE.includes(phase)) return;
    speechSynthesis.cancel(); // drop anything still queued, e.g. the countdown numbers
    say("Recording disrupted. Get back into position and it will restart.");
    setDisrupted(true);
    setPhase("waiting");
  }, [phase, ready]);

  // Collect every live frame during the take. shortcut: live detection runs at the webcam's rate (~30 fps,
  // what the metrics expect); re-run extractFrames on the saved video if a slow device drops frames.
  useEffect(() => {
    if (phase === "recording" && frame) frames.current.push({ ...frame, t: frame.t - startedAt.current });
  }, [phase, frame]);

  // 4. Countdown and recording each run a 1-second ticker; when it hits 0 we move to the next phase.
  useEffect(() => {
    if (phase !== "countdown" && phase !== "recording") return;

    let recorder: MediaRecorder | undefined;
    let finished = false; // only a full 30 s take is handed over; a disrupted one is thrown away
    if (phase === "recording") {
      const chunks: Blob[] = [];
      recorder = new MediaRecorder(stream!);
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        if (finished) onDone(new Blob(chunks, { type: recorder!.mimeType }), frames.current);
      };
      frames.current = [];
      startedAt.current = performance.now();
      recorder.start();
      say("Recording. Keep running naturally.");
    }

    let left = phase === "countdown" ? COUNTDOWN_S : RECORD_S;
    setSecondsLeft(left);
    if (phase === "countdown") say(String(left)); // "10"
    const id = setInterval(() => {
      left -= 1;
      setSecondsLeft(left);
      if (phase === "countdown" && left > 0) say(String(left)); // "9" ... "1"
      if (phase === "recording" && left === 15) say("15 seconds left.");
      if (left === 0) {
        clearInterval(id);
        if (phase === "recording") {
          finished = true;
          say("Done! You can stop the treadmill.");
        }
        setPhase(phase === "countdown" ? "recording" : "done");
      }
    }, 1000);

    // Leaving this phase (or the page) stops the ticker and the recorder.
    return () => {
      clearInterval(id);
      if (recorder?.state === "recording") recorder.stop();
    };
  }, [phase, stream, onDone]);

  return (
    <div aria-live="polite">
      {phase === "waiting" && (
        <p className={`absolute top-6 left-1/2 w-[min(32rem,calc(100vw-9rem))] -translate-x-1/2 rounded-lg px-5 py-3 text-center font-medium shadow-md ${disrupted ? "bg-ink text-white" : "bg-surface"}`}>
          {disrupted
            ? "Recording disrupted. Get back into position and it will restart."
            : "Get into position. Recording starts automatically once every check passes."}
        </p>
      )}
      {phase === "countdown" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="relative grid size-72 place-items-center">
            <span aria-hidden className="absolute inset-0 rounded-full bg-accent/30 motion-safe:animate-breathe" />
            <span className="relative text-[10rem] leading-none font-extrabold text-white tabular-nums drop-shadow-lg">{secondsLeft}</span>
          </div>
          <p className="absolute top-[calc(50%+10rem)] text-h3 text-white drop-shadow">Start the treadmill</p>
        </div>
      )}
      {phase === "announcing" && (
        <p className="absolute top-6 left-1/2 w-[min(32rem,calc(100vw-9rem))] -translate-x-1/2 rounded-lg bg-surface px-5 py-3 text-center font-medium shadow-md">
          Position reached. Start the treadmill…
        </p>
      )}
      {phase === "recording" && (
        <p className="absolute top-6 left-1/2 -translate-x-1/2 rounded-full bg-surface px-5 py-2 font-bold tabular-nums shadow-md">
          <span className="text-red-600">●</span> Recording · {secondsLeft} s left
        </p>
      )}
    </div>
  );
}
