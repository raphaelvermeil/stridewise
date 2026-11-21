// Part 3: Recharts line chart of one metric across sessions, goal shown as a band, with a headline blurb.
"use client";

import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { METRIC_LABELS, formatMetric, inGoal, shortDate } from "@/lib/metrics/labels";
import { card } from "@/components/ui/styles";
import GoalBadge from "@/components/ui/GoalBadge";
import type { Goal, MetricKey, Session } from "@/lib/types";

type Props = { metric: MetricKey; sessions: Session[]; goal?: Goal }; // sessions oldest first

const axis = { tickLine: false, axisLine: false, fontSize: 12, stroke: "var(--color-muted)" };

export default function MetricChart({ metric, sessions, goal }: Props) {
  const { name, unit } = METRIC_LABELS[metric];
  const data = sessions.filter((s) => s.metrics[metric] != null).map((s) => ({ date: shortDate(s.createdAt), value: s.metrics[metric] }));
  if (data.length === 0) return null; // older sessions may predate this metric

  const latest = data.at(-1)!.value;
  const change = latest - data[0].value;

  return (
    <section className={`${card} flex flex-col gap-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-h4">{name}</h3>
          <p className="mt-1 tabular-nums">
            <span className="text-metric">{formatMetric(metric, latest)}</span>
            <span className="ml-1 text-body-lg font-bold">{unit}</span>
          </p>
          {data.length > 1 && (
            <p className="mt-1 text-body-sm text-muted">
              {change >= 0 ? "+" : "−"}{formatMetric(metric, Math.abs(change))} {unit} since your first scan
            </p>
          )}
        </div>
        {goal && <GoalBadge ok={inGoal(latest, goal)} />}
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke="var(--color-bg)" />
            <XAxis dataKey="date" {...axis} />
            <YAxis domain={["auto", "auto"]} width={48} tickFormatter={(v: number) => formatMetric(metric, v)} {...axis} />
            {goal && (
              <ReferenceArea y1={goal.min} y2={goal.max} ifOverflow="extendDomain" fill="var(--color-accent)" fillOpacity={0.35} stroke="none" />
            )}
            <Tooltip
              formatter={(v) => [`${formatMetric(metric, Number(v))} ${unit}`, name]}
              contentStyle={{ border: "none", borderRadius: 10, boxShadow: "var(--shadow-md)" }}
            />
            <Line dataKey="value" stroke="var(--color-ink)" strokeWidth={2} isAnimationActive={false}
              dot={{ r: 4, fill: "var(--color-ink)", stroke: "var(--color-surface)", strokeWidth: 2 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {goal && <p className="text-body-sm text-muted">Shaded band: your goal, {formatMetric(metric, goal.min)}–{formatMetric(metric, goal.max)} {unit}</p>}
    </section>
  );
}
