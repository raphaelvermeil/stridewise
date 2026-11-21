// Part 2: speed + camera check -> voice prompt + countdown -> record -> analyze
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VideoUpload from "@/components/scan/VideoUpload";
import PoseOverlay from "@/components/scan/PoseOverlay";
import CameraCheck from "@/components/scan/CameraCheck";
import SpeedInput from "@/components/scan/SpeedInput";
import Recorder from "@/components/scan/Recorder";
import { setLatestRecording } from "@/lib/recording";
import type { LandmarkFrame } from "@/lib/types";

export default function ScanPage() {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null); // the live webcam feed
  const [videoUrl, setVideoUrl] = useState<string | null>(null); // set when a clip is uploaded
  const [frame, setFrame] = useState<LandmarkFrame | null>(null); // latest body points from the overlay
  const [speedKmh, setSpeedKmh] = useState<number | null>(null); // null until a valid speed is entered
  const [cameraReady, setCameraReady] = useState(false); // camera check passing (with a 1 s grace either way)
  const router = useRouter();

  // A finished recording goes straight to the page with that scan's data.
  // useCallback keeps this the same function between renders, so the Recorder's timer doesn't restart.
  // TODO (step 4): go to /results/<sessionId> once the scan is analysed and saved.
  const onRecorded = useCallback(
    (url: string) => {
      setLatestRecording(url);
      router.push("/my-data");
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
      {stream && <Recorder ready={cameraReady && speedKmh !== null} stream={stream} onDone={onRecorded} />}
    </main>
  );
}
