// Part 3: edit min / target / max goal for each metric. Saved goals, or computeGoals' suggestions where none are saved.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getGoals, goalsFor, saveGoals, type Profile } from "@/lib/db/profiles";
import { METRIC_LABELS, displayValue, storedValue } from "@/lib/metrics/labels";
import { btnPrimary, card, input, spinner } from "@/components/ui/styles";
import type { Goal } from "@/lib/types";

export default function GoalEditor({ profile }: { profile: Profile }) {
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getGoals().then((saved) => setGoals(goalsFor(profile, saved)), (e) => setMessage(`Could not load your goals: ${e.message}`));
  }, [profile]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next = goals!.map(({ metric }) => ({
      metric,
      min: storedValue(metric, Number(f.get(`${metric}.min`)), profile.heightCm),
      target: storedValue(metric, Number(f.get(`${metric}.target`)), profile.heightCm),
      max: storedValue(metric, Number(f.get(`${metric}.max`)), profile.heightCm),
    }));
    const bad = next.find((g) => !(g.min <= g.target && g.target <= g.max));
    if (bad) return setMessage(`${METRIC_LABELS[bad.metric].name}: min ≤ target ≤ max.`);
    setBusy(true);
    try {
      await saveGoals(next);
      setGoals(next);
      setMessage("Goals saved.");
    } catch (err) {
      setMessage(`Could not save: ${err instanceof Error ? err.message : String(err)}`);
    }
    setBusy(false);
  }

  if (!goals) return message ? <p role="alert" className="text-muted">{message}</p> : null;

  return (
    <form onSubmit={submit} className={`${card} flex flex-col gap-4`}>
      <div className="grid grid-cols-[1fr_repeat(3,5.5rem)] items-center gap-x-3 gap-y-3">
        <span />
        {["Min", "Target", "Max"].map((h) => (
          <span key={h} className="text-body-sm text-muted">{h}</span>
        ))}
        {goals.map((g) => (
          <div key={g.metric} className="contents">
            <span className="font-medium">
              {METRIC_LABELS[g.metric].name} <span className="text-body-sm font-normal text-muted">{METRIC_LABELS[g.metric].unit}</span>
            </span>
            {(["min", "target", "max"] as const).map((k) => (
              <input key={k} className={`${input} w-full min-w-0`} name={`${g.metric}.${k}`} type="number" step="any" required
                defaultValue={g[k] == null ? undefined : Math.round(displayValue(g.metric, g[k], profile.heightCm) * 10) / 10} aria-label={`${METRIC_LABELS[g.metric].name} ${k}`} />
            ))}
          </div>
        ))}
      </div>
      <button className={`${btnPrimary} mt-2`} disabled={busy}>{busy ? <><span aria-hidden className={`${spinner} mr-2 size-4`} />Saving…</> : "Save goals"}</button>
      {message && <p role="alert" className="text-body-sm text-muted">{message}</p>}
    </form>
  );
}
