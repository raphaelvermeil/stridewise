// Part 2: the last finished recording, shown at the bottom of My Data.
"use client";

import { getLatestRecording } from "@/lib/recording";

export default function LatestRecording() {
  const url = getLatestRecording();
  if (!url) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">Latest recording</h2>
      <video src={url} controls playsInline className="block w-full max-w-2xl" />
    </section>
  );
}
