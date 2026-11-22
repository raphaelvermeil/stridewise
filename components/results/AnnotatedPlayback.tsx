// Part 2: a recorded video with the skeleton drawn on top. Use it for any saved scan (latest recording, Supabase videos, results page).
"use client";

import { useState } from "react";
import PoseOverlay from "@/components/scan/PoseOverlay";

export default function AnnotatedPlayback({ src }: { src: string }) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-black shadow-sm">
      <video ref={setVideo} src={src} controls muted playsInline className="block w-full" />
      <PoseOverlay video={video} />
    </div>
  );
}
