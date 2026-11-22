// Part 1 dev tool: pick a clip, extract landmarks, save them as fixtures/landmarks/<date>_session-<n>.json,
// then show the metrics and score for the runner details entered below.
"use client";
import { useRef, useState } from "react";
import { extractFrames } from "@/lib/pose/landmarker";
import { analyze, analyzeOverTime } from "@/lib/metrics";
import SessionTimeline from "@/components/results/SessionTimeline";
import { METRIC_LABELS, displayValue } from "@/lib/metrics/labels";
import { scoreRun } from "@/lib/Goal_value/scoreRun";
import type { Fitness, Sex } from "@/lib/Goal_value/computeGoals";
import type { LandmarkFrame } from "@/lib/types";

const fmt = (v: number) => (Math.abs(v) < 2 ? v.toFixed(3) : v.toFixed(1));

export default function LandmarksDevPage() {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Pick a clip");
  const [frames, setFrames] = useState<LandmarkFrame[] | null>(null);
  const [runner, setRunner] = useState({
    heightCm: 175, weightKg: 75, age: 45, speedKmh: 9, sex: "male" as Sex, fitness: "intermediate" as Fitness,
  });

  async function onFile(file: File) {
    try {
      setFrames(null);
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
      setFrames(frames);
      const res = await fetch("/api/dev/landmarks", { method: "POST", body: JSON.stringify(frames) });
      setStatus(res.ok ? `${frames.length} frames → fixtures/landmarks/${(await res.json()).name}` : `Save failed: ${await res.text()}`);
    } catch (e) {
      setStatus(`Failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  const num = (k: "heightCm" | "weightKg" | "age" | "speedKmh", label: string) => (
    <label className="flex flex-col text-sm">
      {label}
      <input type="number" step="any" className="w-24 rounded border p-1" value={runner[k]}
        onChange={(e) => setRunner({ ...runner, [k]: Number(e.target.value) })} />
    </label>
  );

  // shortcut: no injuries input yet; add checkboxes if injury-adjusted goals need testing here.
  const result = frames && scoreRun({ ...runner, injuries: [] }, analyze(frames, runner.heightCm), runner.speedKmh);

  return (
    <main className="p-4 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        {num("heightCm", "Height (cm)")}
        {num("weightKg", "Weight (kg)")}
        {num("age", "Age")}
        {num("speedKmh", "Treadmill (km/h)")}
        <label className="flex flex-col text-sm">
          Sex
          <select className="rounded border p-1" value={runner.sex} onChange={(e) => setRunner({ ...runner, sex: e.target.value as Sex })}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Level
          <select className="rounded border p-1" value={runner.fitness} onChange={(e) => setRunner({ ...runner, fitness: e.target.value as Fitness })}>
            {["beginner", "intermediate", "advanced", "elite"].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
      </div>

      <input type="file" accept="video/*" onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // so picking the same file again still triggers
          if (file) onFile(file);
        }}
      />
      <p>{status}</p>

      {result && (
        <table className="text-sm">
          <thead>
            <tr className="text-left">
              <th className="pr-4">Metric</th><th className="pr-4">Weight</th><th className="pr-4">Measured</th>
              <th className="pr-4">Goal (range)</th><th>Score</th>
            </tr>
          </thead>
          <tbody>
            {result.breakdown.map((p) => {
              const g = result.goals[p.metric];
              const { name, unit } = METRIC_LABELS[p.metric];
              const show = (v: number) => displayValue(p.metric, v, runner.heightCm);
              return (
                <tr key={p.metric}>
                  <td className="pr-4">{name}</td>
                  <td className="pr-4">{p.weightPct}%</td>
                  <td className="pr-4">{fmt(show(p.value))} {unit}</td>
                  <td className="pr-4">{fmt(show(g.target))} {unit} ({fmt(show(g.min))} – {fmt(show(g.max))})</td>
                  <td>{p.score}</td>
                </tr>
              );
            })}
            <tr className="font-semibold">
              <td className="pr-4 pt-2" colSpan={4}>Session score</td>
              <td className="pt-2">{result.score}</td>
            </tr>
          </tbody>
        </table>
      )}

      {result && frames && <SessionTimeline points={analyzeOverTime(frames, runner.heightCm)} goals={result.goals} heightCm={runner.heightCm} />}

      <video ref={video} muted playsInline className="max-w-xl" />
    </main>
  );
}
