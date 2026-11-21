// Part 2: speed + camera check -> voice prompt + countdown -> record -> analyze
"use client";

import { useEffect, useState } from "react";
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
      <SpeedInput onChange={setSpeedKmh} />
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
      <CameraCheck frame={frame} onReady={setCameraReady} />
      {/* The finished recording shows on My Data. Step 4 also sends it to the analysis. */}
      {stream && <Recorder ready={cameraReady && speedKmh !== null} stream={stream} onDone={setLatestRecording} />}
    </main>
  );
}
