// Part 1 → Part 3: every metric over the session (analyzeOverTime), one small chart each, goal range shaded.
"use client";

import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { METRIC_LABELS, displayValue } from "@/lib/metrics/labels";
import type { MetricKey, MetricPoint } from "@/lib/types";

type Range = { target: number; min: number; max: number };

// Reference palette (dataviz skill): series slot 1, secondary text, recessive grid/axis, status "good" for the goal zone.
const SERIES = "#2a78d6";
const MUTED = "#52514e";
const GRID = "#e5e5e2";
const BAND = "rgba(12, 163, 12, 0.18)";
const BAND_EDGE = "rgba(12, 163, 12, 0.45)";

const fmt = (v: number) => (Math.abs(v) < 2 ? v.toFixed(3) : v.toFixed(1));

export default function SessionTimeline({ points, goals, heightCm }: {
  points: MetricPoint[];
  goals: Record<MetricKey, Range>;
  heightCm: number; // converts the ratio metrics to cm
}) {
  const keys = Object.keys(METRIC_LABELS) as MetricKey[];
  // Recharts draws a gap for null, not NaN.
  const data = points.map((p) => {
    const row: Record<string, number | null> = { s: p.t / 1000 };
    for (const k of keys) row[k] = Number.isFinite(p[k]) ? displayValue(k, p[k], heightCm) : null;
    return row;
  });

  return (
    <section className="space-y-2">
      <p className="text-sm" style={{ color: MUTED }}>
        Smoothed over 5 steps. Green band = goal range, dashed line = target.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {keys.map((k) => {
          const { name, unit } = METRIC_LABELS[k];
          const [min, max, target] = [goals[k].min, goals[k].max, goals[k].target].map((v) => displayValue(k, v, heightCm));
          return (
            <figure key={k} className="rounded border p-2">
              <figcaption className="text-sm font-medium">
                {name} <span style={{ color: MUTED }}>({unit})</span>
              </figcaption>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <ReferenceArea y1={min} y2={max} fill={BAND} stroke={BAND_EDGE} strokeWidth={1} ifOverflow="extendDomain" />
                    <ReferenceLine y={target} stroke={MUTED} strokeDasharray="4 4" ifOverflow="extendDomain" />
                    <XAxis dataKey="s" type="number" domain={["dataMin", "dataMax"]} stroke={GRID}
                      tick={{ fontSize: 11, fill: MUTED }} tickFormatter={(v) => `${Math.round(v)}s`} />
                    <YAxis width={44} domain={["auto", "auto"]} stroke={GRID} tick={{ fontSize: 11, fill: MUTED }} />
                    <Tooltip
                      formatter={(v) => [`${fmt(Number(v))} ${unit}`, name]}
                      labelFormatter={(v) => `${Number(v).toFixed(1)} s`}
                    />
                    <Line dataKey={k} stroke={SERIES} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
