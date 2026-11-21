// Part 2: camera check -> countdown -> record (or upload a file) -> analyze
"use client";

import { useState } from "react";
import VideoUpload from "@/components/scan/VideoUpload";
import PoseOverlay from "@/components/scan/PoseOverlay";

export default function ScanPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">New scan</h1>
      <VideoUpload onSelect={setVideoUrl} />
      {videoUrl && (
        <div className="relative w-full max-w-2xl">
          <video ref={setVideo} src={videoUrl} controls muted playsInline className="block w-full" />
          <PoseOverlay video={video} />
        </div>
      )}
    </main>
  );
}
