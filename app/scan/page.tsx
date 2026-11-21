// Part 2: speed + camera check -> voice prompt + countdown -> record -> analyze -> save
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VideoUpload from "@/components/scan/VideoUpload";
import PoseOverlay from "@/components/scan/PoseOverlay";
import CameraCheck from "@/components/scan/CameraCheck";
import SpeedInput from "@/components/scan/SpeedInput";
import Recorder from "@/components/scan/Recorder";
import { setLatestRecording } from "@/lib/recording";
import { say } from "@/lib/voice";
import { analyze } from "@/lib/metrics";
import { getProfile } from "@/lib/db/profiles";
import { saveScan } from "@/lib/db/sessions";
import type { LandmarkFrame } from "@/lib/types";

export default function ScanPage() {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null); // the live webcam feed
  const [videoUrl, setVideoUrl] = useState<string | null>(null); // set when a clip is uploaded
  const [frame, setFrame] = useState<LandmarkFrame | null>(null); // latest body points from the overlay
  const [speedKmh, setSpeedKmh] = useState<number | null>(null); // null until a valid speed is entered
  const [cameraReady, setCameraReady] = useState(false); // camera check passing (with a 1 s grace either way)
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const speedRef = useRef(speedKmh);
  speedRef.current = speedKmh;
  const router = useRouter();

  // A finished take is analysed and saved to Supabase (video + landmarks + metrics, per user), then we go to My Data.
  // Stable (router never changes) so the Recorder timer is not restarted mid-take; reads the speed through a ref.
  // If saving fails we stay here so the error can be read.
  const onRecorded = useCallback(
    async (video: Blob, frames: LandmarkFrame[]) => {
      setLatestRecording(URL.createObjectURL(video)); // still shown on My Data even if saving fails
      setSaveStatus("Saving your scan…");
      say("Saving your scan.");
      try {
        const profile = await getProfile();
        if (!profile) throw new Error("finish onboarding first (your height is needed for the metrics)");
        await saveScan({ treadmillSpeedKmh: speedRef.current!, metrics: analyze(frames, profile.heightCm), landmarks: frames, video });
        router.push("/my-data");
      } catch (e) {
        setSaveStatus(`Could not save the scan: ${e instanceof Error ? e.message : String(e)}`);
        say("Could not save the scan. Check the screen for details.");
      }
    },
    [router],
  );

  // Turn the webcam on when the <video> appears, and off again when the page closes or a clip is uploaded.
  useEffect(() => {
    if (!video || videoUrl) return;
    let s: MediaStream | undefined;
    let closed = false;
    navigator.mediaDevices.getUserMedia({ video: true }).then((camera) => {
      if (closed) return camera.getTracks().forEach((t) => t.stop()); // page closed before the camera was ready
      s = camera;
      video.srcObject = camera;
      setStream(camera);
    });
    return () => {
      closed = true;
      s?.getTracks().forEach((t) => t.stop());
      video.srcObject = null; // otherwise the dead camera feed hides an uploaded clip
      setStream(null);
    };
  }, [video, videoUrl]);

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">New scan</h1>
      {/* TODO: remove upload before the final product (live recording only). Kept so Parts 1 and 3 can test with clips. */}
      <VideoUpload onSelect={setVideoUrl} />
      <SpeedInput
        onChange={(kmh) => {
          setSpeedKmh(kmh);
          if (kmh === null) setCameraReady(false); // the camera check restarts from scratch once a speed is back
        }}
      />
      <div className="relative w-full max-w-2xl">
        <video
          ref={setVideo}
          src={videoUrl ?? undefined}
          controls={!!videoUrl}
          autoPlay
          muted
          playsInline
          className="block w-full"
        />
        <PoseOverlay video={video} onFrame={setFrame} />
      </div>
      {/* Speed is mandatory: the position check only starts once a valid speed is entered. */}
      {speedKmh === null ? (
        <p className="font-medium text-amber-600">Enter your treadmill speed above to start the position check.</p>
      ) : (
        <CameraCheck frame={frame} onReady={setCameraReady} />
      )}
      {stream && <Recorder ready={cameraReady && speedKmh !== null} stream={stream} frame={frame} onDone={onRecorded} />}
      {saveStatus && <p aria-live="polite">{saveStatus}</p>}
    </main>
  );
}
