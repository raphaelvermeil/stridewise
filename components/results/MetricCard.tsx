// Part 3: one metric: value, goal range, good/needs work
import { METRIC_LABELS, formatMetric, inGoal } from "@/lib/metrics/labels";
import { card } from "@/components/ui/styles";
import GoalBadge from "@/components/ui/GoalBadge";
import type { Goal, MetricKey } from "@/lib/types";

export default function MetricCard({ metric, value, goal }: { metric: MetricKey; value: number; goal?: Goal }) {
  const { name, unit } = METRIC_LABELS[metric];
  const fmt = (v: number) => formatMetric(metric, v);

  // Gauge scale: the goal band and the value, with some room either side.
  const lo = Math.min(goal?.min ?? value, value);
  const hi = Math.max(goal?.max ?? value, value);
  const pad = (hi - lo) * 0.3 || 1;
  const pct = (x: number) => ((x - (lo - pad)) / (hi - lo + 2 * pad)) * 100;

  return (
    <section className={`${card} flex flex-col gap-4`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-h4">{name}</h3>
        {goal && <GoalBadge ok={inGoal(value, goal)} />}
      </div>
      <p className="tabular-nums">
        <span className="text-metric-lg">{fmt(value)}</span>
        <span className="ml-1 text-body-lg font-bold">{unit}</span>
      </p>
      {goal && (
        <>
          <div role="img" aria-label={`${fmt(value)} ${unit}, goal ${fmt(goal.min)} to ${fmt(goal.max)}`} className="relative h-2 rounded-full bg-bg">
            <div className="absolute inset-y-0 rounded-full bg-accent" style={{ left: `${pct(goal.min)}%`, width: `${pct(goal.max) - pct(goal.min)}%` }} />
            <div className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-2 ring-surface" style={{ left: `${pct(value)}%` }} />
          </div>
          <p className="text-body-sm text-muted">Goal {fmt(goal.min)}–{fmt(goal.max)} {unit}</p>
        </>
      )}
    </section>
  );
}
