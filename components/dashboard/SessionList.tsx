// Part 3: past sessions, newest first, click to open results
import Link from "next/link";
import { goalsMet } from "@/lib/metrics/labels";
import type { Goal, Session } from "@/lib/types";

type Props = { sessions: Session[]; goalsAt: (s: Session) => Goal[]; score: (s: Session) => number | null };

export default function SessionList({ sessions, goalsAt, score }: Props) {
  return (
    <ul className="flex flex-col gap-3">
      {sessions.toReversed().map((s) => (
        <li key={s.id}>
          <Link href={`/results/${s.id}`}
            className="flex items-center justify-between gap-4 rounded-lg bg-surface px-6 py-4 shadow-xs transition duration-200 ease-out hover:shadow-md active:scale-[0.97]">
            <div>
              <p className="text-h4">
                {new Date(s.createdAt).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </p>
              <p className="text-body-sm text-muted">{s.treadmillSpeedKmh} km/h · {goalsMet(s.metrics, goalsAt(s))} of {goalsAt(s).length} metrics on goal</p>
            </div>
            <div className="flex items-center gap-4">
              {score(s) !== null && (
                <p className="text-right tabular-nums">
                  <span className="text-metric">{score(s)}</span>
                  <span className="block text-body-sm text-muted">form score</span>
                </p>
              )}
              <span aria-hidden className="text-h3 text-muted">›</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
