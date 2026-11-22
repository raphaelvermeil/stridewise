// Part 2: help -> full-screen webcam -> speed -> camera check -> voice prompt + countdown -> record -> analyze -> save -> results
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PoseOverlay from "@/components/scan/PoseOverlay";
import CameraCheck from "@/components/scan/CameraCheck";
import SpeedInput from "@/components/scan/SpeedInput";
import Recorder from "@/components/scan/Recorder";
import ScanHelp from "@/components/scan/ScanHelp";
import { say } from "@/lib/voice";
import { analyze } from "@/lib/metrics";
import { getGoals, getProfile, goalsFor, scoreFor } from "@/lib/db/profiles";
import { saveScan } from "@/lib/db/sessions";
import { btnPrimary, btnSecondary, card } from "@/components/ui/styles";
import type { LandmarkFrame } from "@/lib/types";

const roundBtn = "grid size-11 place-items-center rounded-full bg-surface text-h4 shadow-md transition duration-200 ease-out hover:shadow-lg active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-focus";

export default function ScanPage() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(true); // shown on arrival; the "?" button reopens it
  const [started, setStarted] = useState(false); // help closed once -> full-screen camera
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null); // the live webcam feed
  const [frame, setFrame] = useState<LandmarkFrame | null>(null); // latest body points from the overlay
  const [speedKmh, setSpeedKmh] = useState<number | null>(null); // null until a valid speed is entered
  const [speedConfirmed, setSpeedConfirmed] = useState(false); // so a half-typed speed can't start the countdown
  const [cameraReady, setCameraReady] = useState(false); // camera check passing (with a 1 s grace either way)
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const speedRef = useRef(speedKmh);
  speedRef.current = speedKmh;
  const take = useRef<{ video: Blob; frames: LandmarkFrame[] } | null>(null); // kept so a failed save can be retried

  const save = useCallback(async () => {
    const { video, frames } = take.current!;
    setSaving(true);
    setSaveError(null);
    say("Saving your scan.");
    try {
      const [profile, saved] = await Promise.all([getProfile(), getGoals()]);
      if (!profile) throw new Error("finish onboarding first (your height is needed for the metrics)");
      const treadmillSpeedKmh = speedRef.current!;
      const metrics = analyze(frames, profile.heightCm);
      // Score frozen at save time, so later profile edits don't rewrite this scan's history.
      const { score } = scoreFor(profile, goalsFor(profile, saved, treadmillSpeedKmh), { metrics, treadmillSpeedKmh });
      const session = await saveScan({ treadmillSpeedKmh, metrics, score, landmarks: frames, video });
      router.push(`/results/${session.id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
      say("Could not save the scan. Check the screen for details.");
    }
  }, [router]);

  // Stable (no deps that change) so the Recorder timer is not restarted mid-take.
  const onRecorded = useCallback((video: Blob, frames: LandmarkFrame[]) => {
    take.current = { video, frames };
    save();
  }, [save]);

  // Turn the webcam on when the <video> appears, and off again when the page closes.
  useEffect(() => {
    if (!video) return;
    let s: MediaStream | undefined;
    let closed = false;
    navigator.mediaDevices.getUserMedia({ video: true }).then((camera) => {
      if (closed) return camera.getTracks().forEach((t) => t.stop()); // page closed before the camera was ready
      s = camera;
      video.srcObject = camera;
      setStream(camera);
    }, (e) => setCameraError(`We couldn't open your camera: ${e.message}`));
    return () => {
      closed = true;
      s?.getTracks().forEach((t) => t.stop());
      setStream(null);
    };
  }, [video]);

  // Help pauses the scan: silence the voice and reset the check, so it starts fresh (and quiet) once help closes.
  const openHelp = () => {
    speechSynthesis.cancel();
    setCameraReady(false);
    setHelpOpen(true);
  };

  const closeHelp = () => {
    setHelpOpen(false);
    setStarted(true);
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h1">New Scan</h1>
        <button onClick={openHelp} aria-label="How to set up" className={roundBtn}>?</button>
      </div>

      {started && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Gone once the take is saving: removing the <video> also switches the webcam off (see the effect above). */}
          {!saving && (
            <>
              <video ref={setVideo} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-contain" />
              <PoseOverlay video={video} onFrame={setFrame} />
            </>
          )}

          {/* safe-area: keep the buttons clear of phone notches in full screen */}
          <div className="absolute inset-x-0 top-0 flex justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-6">

            <Link href="/dashboard" aria-label="Cancel scan" className={roundBtn}>✕</Link>
            <button onClick={openHelp} aria-label="How to set up" className={roundBtn}>?</button>
          </div>

          {cameraError && (
            <div className={`${card} absolute top-1/2 left-1/2 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2`}>
              <p role="alert">{cameraError}</p>
              <p className="mt-2 text-body-sm text-muted">Allow camera access in your browser, then reload this page.</p>
            </div>
          )}

          {stream && !speedConfirmed && (
            // noValidate: the browser would reject 10.3 for not matching the 0.5 arrow steps; SpeedInput checks the range itself.
            <form noValidate onSubmit={(e) => { e.preventDefault(); setSpeedConfirmed(true); }}
              className={`${card} absolute top-1/2 left-1/2 flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4`}>
              <SpeedInput onChange={setSpeedKmh} />
              <button className={btnPrimary} disabled={speedKmh === null}>Confirm Speed</button>
            </form>
          )}

          {stream && speedConfirmed && !saving && !helpOpen && (
            <>
              <div className={`${card} absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 space-y-2 py-4`}>
                <CameraCheck frame={frame} onReady={setCameraReady} />
              </div>
              <Recorder ready={cameraReady} stream={stream} frame={frame} onDone={onRecorded} />
            </>
          )}

          {saving && (
            <div className="absolute inset-0 grid place-items-center bg-ink/70 p-4">
              <div className={`${card} w-[min(28rem,100%)] text-center`} aria-live="polite">
                {saveError ? (
                  <>
                    <h2 className="text-h3">Could Not Save the Scan</h2>
                    <p className="mt-2 text-muted">{saveError}. Check your connection, then press Try Again.</p>
                    <div className="mt-6 flex justify-center gap-3">
                      <Link href="/dashboard" className={btnSecondary}>Discard</Link>
                      <button onClick={save} className={btnPrimary}>Try Again</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div aria-hidden className="mx-auto size-12 animate-spin rounded-full border-4 border-accent border-t-ink" />
                    <h2 className="mt-5 text-h3">Analysing Your Stride</h2>
                    <p className="mt-2 text-muted">Saving your video and measuring every step…</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {helpOpen && <ScanHelp onClose={closeHelp} first={!started} />}
    </main>
  );
}
