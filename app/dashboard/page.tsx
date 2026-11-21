// Part 3: dashboard: progress summary, one chart per metric across scans, then the list of past scans
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProfile, goalsFor } from "@/lib/db/profiles";
import { listSessions } from "@/lib/db/sessions";
import { METRIC_LABELS, goalsMet, shortDate } from "@/lib/metrics/labels";
import MetricChart from "@/components/dashboard/MetricChart";
import SessionList from "@/components/dashboard/SessionList";
import { btnPrimary, card } from "@/components/ui/styles";
import type { Goal, MetricKey, Session } from "@/lib/types";

const WEEK_MS = 7 * 24 * 3600 * 1000;

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[] | null>(null); // oldest first
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listSessions(), getProfile().then((p) => (p ? goalsFor(p) : []))]).then(
      ([s, g]) => {
        setSessions(s);
        setGoals(g);
      },
      (e) => setError(`Could not load your scans: ${e.message}`),
    );
  }, []);

  const latest = sessions?.at(-1);
  const weeks = sessions && sessions.length > 1
    ? Math.max(1, Math.round((Date.parse(latest!.createdAt) - Date.parse(sessions[0].createdAt)) / WEEK_MS))
    : 0;

  return (
    <main className="mx-auto max-w-5xl space-y-12 px-6 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">Your progress</h1>
          <p className="mt-2 text-body-lg text-muted">How your form is changing, scan by scan.</p>
        </div>
        <Link href="/scan" className={btnPrimary}>New scan</Link>
      </div>

      {error && <p role="alert" className="text-muted">{error}</p>}

      {sessions?.length === 0 && (
        <section className={`${card} py-12 text-center`}>
          <h2 className="text-h2">No scans yet</h2>
          <p className="mx-auto mt-2 max-w-md text-body-lg text-muted">
            Set up your camera by the treadmill and run for 30 seconds. Your first scan sets the baseline for everything here.
          </p>
          <Link href="/scan" className={`${btnPrimary} mt-6`}>Start your first scan</Link>
        </section>
      )}

      {latest && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className={card}>
              <p className="text-body-sm text-muted">Scans</p>
              <p className="mt-1 text-metric-lg tabular-nums">{sessions!.length}</p>
              <p className="mt-1 text-body-sm text-muted">{weeks ? `over ${weeks} week${weeks > 1 ? "s" : ""}` : "your baseline"}</p>
            </div>
            <div className={card}>
              <p className="text-body-sm text-muted">On goal, latest scan</p>
              <p className="mt-1 tabular-nums">
                <span className="text-metric-lg">{goalsMet(latest.metrics, goals)}</span>
                <span className="ml-1 text-h4">/ {goals.length}</span>
              </p>
              <p className="mt-1 text-body-sm text-muted">metrics inside your goal range</p>
            </div>
            <div className={card}>
              <p className="text-body-sm text-muted">Latest scan</p>
              <p className="mt-1 text-metric-lg">{shortDate(latest.createdAt)}</p>
              <p className="mt-1 text-body-sm text-muted">at {latest.treadmillSpeedKmh} km/h</p>
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-h2">Metrics over time</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(Object.keys(METRIC_LABELS) as MetricKey[]).map((m) => (
                <MetricChart key={m} metric={m} sessions={sessions!} goal={goals.find((g) => g.metric === m)} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-h2">Past scans</h2>
            <SessionList sessions={sessions!} goals={goals} />
          </section>
        </>
      )}
    </main>
  );
}
