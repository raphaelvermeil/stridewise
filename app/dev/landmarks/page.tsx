// Part 1 dev tool: pick a clip, extract landmarks, save them as fixtures/landmarks/<date>_session-<n>.json.
"use client";
import { useRef, useState } from "react";
import { extractFrames } from "@/lib/pose/landmarker";

export default function LandmarksDevPage() {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Pick a clip");

  async function onFile(file: File) {
    try {
      const v = video.current!;
      setStatus(`Loading ${file.name}…`);
      v.src = URL.createObjectURL(file);
      await new Promise((ok, fail) => {
        v.addEventListener("loadeddata", ok, { once: true });
        // e.g. iPhone HEVC .mov in Chrome
        v.addEventListener("error", () => fail(new Error("this browser can't play this video format")), { once: true });
      });
      setStatus("Extracting… (about 1–3× the video length)");
      const frames = await extractFrames(v);
      const res = await fetch("/api/dev/landmarks", { method: "POST", body: JSON.stringify(frames) });
      setStatus(res.ok ? `${frames.length} frames → fixtures/landmarks/${(await res.json()).name}` : `Save failed: ${await res.text()}`);
    } catch (e) {
      setStatus(`Failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  return (
    <main className="p-4 space-y-2">
      <input type="file" accept="video/*" onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // so picking the same file again still triggers
          if (file) onFile(file);
        }}
      />
      <p>{status}</p>
      <video ref={video} muted playsInline className="max-w-xl" />
    </main>
  );
}
