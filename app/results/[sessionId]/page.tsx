// Part 3: one scan: the original video, what to work on, and one card per metric
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSession, getVideoUrl } from "@/lib/db/sessions";
import { getProfile, goalsFor } from "@/lib/db/profiles";
import { recommend } from "@/lib/recommendations/rules";
import { METRIC_LABELS, goalsMet } from "@/lib/metrics/labels";
import MetricCard from "@/components/results/MetricCard";
import Recommendations from "@/components/results/Recommendations";
import type { Goal, MetricKey, Session } from "@/lib/types";

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getSession(sessionId), getProfile().then((p) => (p ? goalsFor(p) : []))])
      .then(async ([s, g]) => {
        if (!s) return setError("This scan doesn't exist, or it isn't yours.");
        setSession(s);
        setGoals(g);
        if (s.videoPath) setVideoUrl(await getVideoUrl(s.videoPath));
      })
      .catch((e) => setError(`Could not load this scan: ${e.message}`));
  }, [sessionId]);

  const metrics = session && (Object.keys(METRIC_LABELS) as MetricKey[]).filter((m) => session.metrics[m] != null);

  return (
    <main className="mx-auto max-w-5xl space-y-12 px-6 py-8">
      <div>
        <Link href="/dashboard" className="text-body-sm text-muted hover:text-ink">← Dashboard</Link>
        {session && (
          <>
            <h1 className="mt-3 text-h1">
              {new Date(session.createdAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </h1>
            <p className="mt-2 text-body-lg text-muted">
              {session.treadmillSpeedKmh} km/h · {goalsMet(session.metrics, goals)} of {goals.length} metrics on goal
            </p>
          </>
        )}
      </div>

      {error && <p role="alert" className="text-muted">{error}</p>}

      {session && (
        <>
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <section>
              <h2 className="mb-6 text-h2">Your run</h2>
              {/* shortcut: plain video; AnnotatedPlayback (skeleton from the saved landmarks) can replace it later */}
              {videoUrl ? (
                <video src={videoUrl} controls playsInline className="w-full rounded-lg bg-black shadow-sm" />
              ) : (
                <p className="text-muted">{session.videoPath ? "Loading video…" : "No video was saved for this scan."}</p>
              )}
            </section>
            <section>
              <h2 className="mb-6 text-h2">What to work on</h2>
              <Recommendations items={recommend(session.metrics, goals)} />
            </section>
          </div>

          <section>
            <h2 className="mb-6 text-h2">All metrics</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metrics!.map((m) => (
                <MetricCard key={m} metric={m} value={session.metrics[m]} goal={goals.find((g) => g.metric === m)} />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
