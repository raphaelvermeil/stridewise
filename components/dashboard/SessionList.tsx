// Part 3: past sessions, newest first, click to open results
import Link from "next/link";
import { goalsMet } from "@/lib/metrics/labels";
import type { Goal, Session } from "@/lib/types";

export default function SessionList({ sessions, goals }: { sessions: Session[]; goals: Goal[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {sessions.toReversed().map((s) => (
        <li key={s.id}>
          <Link href={`/results/${s.id}`}
            className="flex items-center justify-between gap-4 rounded-lg bg-surface px-6 py-4 shadow-xs transition duration-200 ease-out hover:shadow-md active:scale-[0.99]">
            <div>
              <p className="text-h4">
                {new Date(s.createdAt).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </p>
              <p className="text-body-sm text-muted">{s.treadmillSpeedKmh} km/h · {goalsMet(s.metrics, goals)} of {goals.length} metrics on goal</p>
            </div>
            <span aria-hidden className="text-h3 text-muted">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
