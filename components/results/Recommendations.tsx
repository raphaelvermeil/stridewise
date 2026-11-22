// Part 3: shows output of lib/recommendations
import { METRIC_LABELS } from "@/lib/metrics/labels";
import { card } from "@/components/ui/styles";
import type { Recommendation } from "@/lib/recommendations/rules";

export default function Recommendations({ items }: { items: Recommendation[] }) {
  if (items.length === 0) {
    return (
      <div className={card}>
        <h3 className="text-h3">Everything Is on Goal</h3>
        <p className="mt-2 text-muted">Every metric with a goal landed inside its range. Keep running the way you are.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((r) => (
        <article key={r.metric} className={card}>
          <h3 className="text-h3">{METRIC_LABELS[r.metric].name}</h3>
          <p className="mt-2">{r.issue}</p>
          <p className="mt-4 rounded-md bg-bg px-4 py-3 text-body-lg font-medium">{r.cue}</p>
          <h4 className="mt-5 text-h4">Try These Drills</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {r.drills.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </article>
      ))}
    </div>
  );
}
