// Part 2: once the runner is in position, a voice prompt, a 10 s countdown, then a 30 s recording that starts and stops on its own.
// If the camera check fails during the countdown or recording, the take is thrown away and it starts over once the runner is back in position.
"use client";

import { useEffect, useState } from "react";
import { say } from "@/lib/voice";

const COUNTDOWN_S = 10;
const RECORD_S = 30;

type Phase = "waiting" | "countdown" | "recording" | "done";

type Props = {
  ready: boolean; // camera check passing and a valid speed is entered
  stream: MediaStream | null; // the live webcam feed to record
  onDone: (videoUrl: string) => void; // must not change between renders, or the timer restarts
};

export default function Recorder({ ready, stream, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [disrupted, setDisrupted] = useState(false);

  // 1. Waiting -> countdown, the moment the runner is in position (first time, or back after a disruption).
  useEffect(() => {
    if (phase !== "waiting" || !ready) return;
    setDisrupted(false);
    say("Position reached correctly. Start the treadmill. Recording starts in ten seconds.");
    setPhase("countdown");
  }, [phase, ready]);

  // 2. Disrupted: a check failed during the countdown or recording -> back to waiting.
  useEffect(() => {
    if (ready || (phase !== "countdown" && phase !== "recording")) return;
    speechSynthesis.cancel(); // drop any "3, 2, 1" still queued
    say("Recording disrupted. Get back into position and it will restart.");
    setDisrupted(true);
    setPhase("waiting");
  }, [phase, ready]);

  // 3. Countdown and recording each run a 1-second ticker; when it hits 0 we move to the next phase.
  useEffect(() => {
    if (phase !== "countdown" && phase !== "recording") return;

    let recorder: MediaRecorder | undefined;
    let finished = false; // only a full 30 s take is handed over; a disrupted one is thrown away
    if (phase === "recording") {
      const chunks: Blob[] = [];
      recorder = new MediaRecorder(stream!);
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        if (finished) onDone(URL.createObjectURL(new Blob(chunks, { type: recorder!.mimeType })));
      };
      recorder.start();
      say("Recording. Keep running naturally.");
    }

    let left = phase === "countdown" ? COUNTDOWN_S : RECORD_S;
    setSecondsLeft(left);
    const id = setInterval(() => {
      left -= 1;
      setSecondsLeft(left);
      if (phase === "countdown" && left > 0 && left <= 3) say(String(left));
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
    <div aria-live="polite" className="text-lg">
      {phase === "waiting" && disrupted && (
        <p className="font-semibold text-red-600">Recording disrupted. Get back into position and it will restart.</p>
      )}
      {phase === "waiting" && !disrupted && (
        <p className="text-gray-600">Enter your speed and get into position. Recording starts automatically once every check passes.</p>
      )}
      {phase === "countdown" && <p className="font-semibold">Start the treadmill. Recording in {secondsLeft}…</p>}
      {phase === "recording" && <p className="font-semibold text-red-600">● Recording… {secondsLeft} s left</p>}
      {phase === "done" && <p className="font-semibold text-green-600">✓ Recording complete. Opening your scan…</p>}
    </div>
  );
}
