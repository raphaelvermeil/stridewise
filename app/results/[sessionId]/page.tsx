// Part 3: one scan: the original video, what to work on, and one card per metric
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getLandmarks, getSession, getVideoUrl } from "@/lib/db/sessions";
import { getGoals, getProfile, goalsFor, scoreFor, type Profile } from "@/lib/db/profiles";
import { recommend } from "@/lib/recommendations/rules";
import { analyzeOverTime } from "@/lib/metrics";
import { METRIC_LABELS, goalsMet } from "@/lib/metrics/labels";
import AnnotatedPlayback from "@/components/results/AnnotatedPlayback";
import MetricCard from "@/components/results/MetricCard";
import Recommendations from "@/components/results/Recommendations";
import RunTimeline from "@/components/results/RunTimeline";
import { card } from "@/components/ui/styles";
import type { Goal, MetricKey, MetricPoint, Session } from "@/lib/types";

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [points, setPoints] = useState<MetricPoint[] | null>(null); // step-by-step metrics, from the saved landmarks
  const [goals, setGoals] = useState<Goal[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getSession(sessionId), getProfile(), getGoals()])
      .then(async ([s, p, saved]) => {
        if (!s) return setError("This scan doesn't exist, or it isn't yours.");
        setGoals(p ? goalsFor(p, saved, s.treadmillSpeedKmh) : []);
        setProfile(p);
        setSession(s);
        const [url, frames] = await Promise.all([s.videoPath ? getVideoUrl(s.videoPath) : null, getLandmarks(s.id)]);
        setVideoUrl(url);
        if (p && frames.length) setPoints(analyzeOverTime(frames, p.heightCm));
      })
      .catch((e) => setError(`Could not load this scan: ${e.message}`));
  }, [sessionId]);

  // Breakdown is live (current profile); the headline uses the score frozen at save time when there is one.
  const score = session && profile && scoreFor(profile, goals, session);
  // The metrics costing the most points: how far from full marks, times how much they count.
  const gains = score ? score.breakdown.filter((b) => b.score < 100).sort((a, b) => (100 - b.score) * b.weightPct - (100 - a.score) * a.weightPct).slice(0, 2) : [];
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
          {score && (
            <section className={`${card} flex flex-wrap items-center gap-x-10 gap-y-4`}>
              <div>
                <p className="text-body-sm text-muted">Form score</p>
                <p className="tabular-nums"><span className="text-metric-xl">{session.score ?? score.score}</span><span className="ml-1 text-h3">/ 100</span></p>
              </div>
              <div className="max-w-md">
                <p>Weighted toward the metrics most linked to injury, at the speed you ran.</p>
                {gains.length > 0 && (
                  <p className="mt-1 text-muted">Most points to gain: {gains.map((g) => METRIC_LABELS[g.metric].name).join(" and ")}.</p>
                )}
              </div>
            </section>
          )}

          <div className="grid items-start gap-8 lg:grid-cols-2">
            <section>
              <h2 className="mb-6 text-h2">Your run</h2>
              {videoUrl ? (
                <AnnotatedPlayback src={videoUrl} />
              ) : (
                <p className="text-muted">{session.videoPath ? "Loading video…" : "No video was saved for this scan."}</p>
              )}
            </section>
            <section>
              <h2 className="mb-6 text-h2">What to work on</h2>
              <Recommendations items={recommend(session.metrics, goals)} />
            </section>
          </div>

          {points && points.length > 0 && (
            <section>
              <h2 className="mb-6 text-h2">During this run</h2>
              <RunTimeline points={points} goals={goals} />
            </section>
          )}

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
