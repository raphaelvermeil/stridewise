// Part 2: camera check -> countdown -> record (or upload a file) -> analyze
"use client";

import { useState } from "react";
import VideoUpload from "@/components/scan/VideoUpload";

export default function ScanPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">New scan</h1>
      <VideoUpload onSelect={setVideoUrl} />
      {videoUrl && <video src={videoUrl} controls className="w-full max-w-2xl" />}
    </main>
  );
}