// Part 3: how one metric moved step by step during a single run (analyzeOverTime), goal shown as a band.
"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { METRIC_LABELS, displayGoal, displayValue, formatMetric } from "@/lib/metrics/labels";
import { card } from "@/components/ui/styles";
import type { Goal, MetricKey, MetricPoint } from "@/lib/types";

const axis = { tickLine: false, axisLine: false, fontSize: 12, stroke: "var(--color-muted)" };

export default function RunTimeline({ points, goals, heightCm }: { points: MetricPoint[]; goals: Goal[]; heightCm: number }) {
  const [metric, setMetric] = useState<MetricKey>("cadenceSpm");
  const { name, unit } = METRIC_LABELS[metric];
  const stored = goals.find((g) => g.metric === metric);
  const goal = stored && displayGoal(stored, heightCm);
  // NaN = no data around that step; null makes Recharts draw a gap.
  const data = points.map((p) => ({ s: p.t / 1000, value: Number.isFinite(p[metric]) ? displayValue(metric, p[metric], heightCm) : null }));

  return (
    <section className={`${card} flex flex-col gap-5`}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Metric">
        {(Object.keys(METRIC_LABELS) as MetricKey[]).map((m) => (
          <button key={m} onClick={() => setMetric(m)} aria-pressed={m === metric}
            className={`rounded-full px-3 py-1.5 text-body-sm font-medium transition duration-200 ease-out active:scale-[0.97] ${m === metric ? "bg-ink text-white" : "bg-bg"}`}>
            {METRIC_LABELS[m].name}
          </button>
        ))}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke="var(--color-bg)" />
            <XAxis dataKey="s" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(s: number) => `${Math.round(s)} s`} {...axis} />
            <YAxis domain={["auto", "auto"]} width={48} tickFormatter={(v: number) => formatMetric(v)} {...axis} />
            {goal && <ReferenceArea y1={goal.min} y2={goal.max} ifOverflow="extendDomain" fill="var(--color-accent)" fillOpacity={0.35} stroke="none" />}
            <Tooltip
              labelFormatter={(s) => `${Number(s).toFixed(1)} s into the run`}
              formatter={(v) => [`${formatMetric(Number(v))} ${unit}`, name]}
              contentStyle={{ border: "none", borderRadius: 10, boxShadow: "var(--shadow-md)" }}
            />
            <Line dataKey="value" stroke="var(--color-ink)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-body-sm text-muted">
        {name}, step by step (smoothed over 5 steps).{goal && ` Shaded band: your goal, ${formatMetric(goal.min)}–${formatMetric(goal.max)} ${unit}.`}
      </p>
    </section>
  );
}
