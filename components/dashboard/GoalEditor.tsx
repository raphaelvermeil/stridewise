// Part 3: edit min / target / max goal for each metric with one three-handle slider each.
// Saved goals, or computeGoals' suggestions where none are saved.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getGoals, goalsFor, saveGoals, type Profile } from "@/lib/db/profiles";
import { useUnsavedWarning } from "@/lib/useUnsavedWarning";
import { METRIC_LABELS, displayValue, formatMetric, storedValue } from "@/lib/metrics/labels";
import { btnPrimary, card, spinner } from "@/components/ui/styles";
import type { Goal, MetricKey } from "@/lib/types";

// Slider ends and step per metric, in the shown unit. Wide enough for every runner's suggested goals;
// widened on the fly if a saved goal is outside.
const SCALE: Record<MetricKey, [lo: number, hi: number, step: number]> = {
  cadenceSpm: [140, 200, 1],
  overstrideRatio: [0, 40, 0.5],
  shinAngleDeg: [-10, 20, 0.5],
  torsoLeanDeg: [-5, 20, 0.5],
  groundContactMs: [180, 400, 5],
  maxThighAngleDeg: [10, 60, 1],
  headOffsetRatio: [-5, 10, 0.5],
  elbowAngleDeg: [50, 140, 1],
  verticalOscillationCm: [2, 16, 0.5],
};

type Range = { min: number; target: number; max: number }; // in the shown unit

export default function GoalEditor({ profile }: { profile: Profile }) {
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [values, setValues] = useState<Partial<Record<MetricKey, Range>>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false); // a handle moved since the last save -> warn before leaving
  useUnsavedWarning(dirty);

  useEffect(() => {
    getGoals().then((saved) => {
      const g = goalsFor(profile, saved);
      const show = (m: MetricKey, v: number) => displayValue(m, v, profile.heightCm);
      setGoals(g);
      setValues(Object.fromEntries(g.map((x) => [x.metric, {
        min: show(x.metric, x.min),
        target: show(x.metric, x.target ?? (x.min + x.max) / 2),
        max: show(x.metric, x.max),
      }])));
    }, (e) => setMessage(`Could not load your goals: ${e.message}`));
  }, [profile]);

  // Moving one handle past another pushes it along, so min ≤ target ≤ max always holds and nothing gets stuck.
  function move(m: MetricKey, k: keyof Range, v: number) {
    const r = values[m]!;
    const next =
      k === "min" ? { min: v, target: Math.max(r.target, v), max: Math.max(r.max, v) }
      : k === "max" ? { max: v, target: Math.min(r.target, v), min: Math.min(r.min, v) }
      : { target: v, min: Math.min(r.min, v), max: Math.max(r.max, v) };
    setValues({ ...values, [m]: next });
    setDirty(true);
    setMessage("");
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const back = (m: MetricKey, v: number) => storedValue(m, v, profile.heightCm);
    const next = goals!.map(({ metric }) => {
      const r = values[metric]!;
      return { metric, min: back(metric, r.min), target: back(metric, r.target), max: back(metric, r.max) };
    });
    setBusy(true);
    try {
      await saveGoals(next);
      setGoals(next);
      setDirty(false);
      setMessage("Goals saved.");
    } catch (err) {
      setMessage(`Could not save: ${err instanceof Error ? err.message : String(err)}`);
    }
    setBusy(false);
  }

  if (!goals) return message ? <p role="alert" className="text-muted">{message}</p> : null;

  return (
    <form onSubmit={submit} className={`${card} flex flex-col gap-8`}>
      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-body-sm text-muted">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-ink bg-surface" /> Min / max: your goal range</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-ink" /> Target: where you'd ideally be</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-ink/20" /> Grey: where it was saved</span>
      </p>

      {goals.map((g) => {
        const m = g.metric;
        const r = values[m]!;
        const label = METRIC_LABELS[m];
        const [lo, hi, step] = SCALE[m];
        // Where each handle was at the last save (goals only changes on load and save), for the ghost markers.
        const show = (v: number) => displayValue(m, v, profile.heightCm);
        const was: Range = { min: show(g.min), target: show(g.target ?? (g.min + g.max) / 2), max: show(g.max) };
        const min = Math.min(lo, Math.floor(Math.min(r.min, was.min))), max = Math.max(hi, Math.ceil(Math.max(r.max, was.max)));
        const pct = (v: number) => ((v - min) / (max - min)) * 100;
        return (
          <div key={m} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-h4">{label.name} <span className="text-body-sm font-normal text-muted">{label.unit}</span></h3>
              <p className="text-body-sm tabular-nums">
                {formatMetric(r.min)} – {formatMetric(r.max)} <span className="text-muted">· target</span> <strong>{formatMetric(r.target)}</strong>
              </p>
            </div>
            <p className="-mt-2 text-body-sm text-muted">{label.blurb}</p>

            {/* Three native range inputs stacked on one track; only their handles take clicks (see .range-multi in globals.css). */}
            <div className="relative h-6 select-none">
              {/* Inset by half a handle (10px): the browser keeps handle centres that far from each end. */}
              <div className="absolute inset-x-2.5 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-bg">
                <div className="absolute inset-y-0 rounded-full bg-accent" style={{ left: `${pct(r.min)}%`, right: `${100 - pct(r.max)}%` }} />
                {/* Ghost markers: a faint copy of each handle left where it was saved, once it has been moved away.
                    Behind the real handles, and they ignore clicks. */}
                {(["min", "max", "target"] as const).map((k) => Math.abs(r[k] - was[k]) >= step / 2 && (
                  <span key={k} aria-hidden style={{ left: `${pct(was[k])}%` }}
                    className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 animate-fade-in rounded-full bg-ink/20" />
                ))}
              </div>
              {(["min", "max", "target"] as const).map((k) => (
                <input key={k} type="range" min={min} max={max} step={step} value={r[k]}
                  onChange={(e) => move(m, k, Number(e.target.value))}
                  aria-label={`${label.name} ${k}`} aria-valuetext={`${formatMetric(r[k])} ${label.unit}`}
                  className={`range-multi absolute inset-0 w-full ${k === "target" ? "range-target" : ""}`} />
              ))}
            </div>
          </div>
        );
      })}

      <button className={`${btnPrimary} self-start`} disabled={busy}>{busy ? <><span aria-hidden className={`${spinner} mr-2 size-4`} />Saving…</> : "Save Goals"}</button>
      {message && <p role="status" className="text-body-sm text-muted">{message}</p>}
    </form>
  );
}
