// Part 1 dev tool: pick a clip, extract landmarks, download them as fixtures/landmarks/<clip>.json.
"use client";
import { useRef, useState } from "react";
import { extractFrames } from "@/lib/pose/landmarker";

export default function LandmarksDevPage() {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Pick a clip");

  async function onFile(file: File) {
    const v = video.current!;
    v.src = URL.createObjectURL(file);
    await new Promise((r) => v.addEventListener("loadeddata", r, { once: true }));
    setStatus("Extracting…");
    const frames = await extractFrames(v);
    setStatus(`${frames.length} frames`);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(frames)], { type: "application/json" }));
    a.download = file.name.replace(/\.\w+$/, ".json");
    a.click();
  }

  return (
    <main className="p-4 space-y-2">
      <input type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <p>{status}</p>
      <video ref={video} muted playsInline className="max-w-xl" />
    </main>
  );
}
