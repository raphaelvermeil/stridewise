// Part 4: onboarding answers and goals for the logged-in user. Browser-only (see sessions.ts).
import { supabase } from "@/lib/supabase/client";
import type { Goal, MetricKey, Session } from "@/lib/types";
import { scoreRun } from "@/lib/Goal_value/scoreRun";
import { computeGoals, isInjury, type Fitness, type Injury, type Runner, type Sex } from "@/lib/Goal_value/computeGoals";

export type Profile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  experience: Fitness; // stored as "experience"; same values as computeGoals' fitness
  runsPerWeek: number;
  injuryHistory: Injury[]; // empty = no past injuries
};

/** The profile in the shape computeGoals expects (experience -> fitness, injuryHistory -> injuries). */
export const toRunner = (p: Profile, speedKmh?: number): Runner => ({
  sex: p.sex,
  age: p.age,
  heightCm: p.heightCm,
  weightKg: p.weightKg,
  fitness: p.experience,
  injuries: p.injuryHistory,
  speedKmh,
});

async function userId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Not logged in");
  return data.session.user.id;
}

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select().maybeSingle();
  if (error) throw error;
  return (
    data && {
      sex: data.sex,
      age: data.age,
      heightCm: Number(data.height_cm),
      weightKg: Number(data.weight_kg),
      experience: data.experience,
      runsPerWeek: data.runs_per_week,
      injuryHistory: (data.injury_history as string[]).filter(isInjury), // older rows can hold free-text injuries
    }
  );
}

export async function saveProfile(p: Profile): Promise<void> {
  const { error } = await supabase.from("profiles").upsert({
    user_id: await userId(),
    sex: p.sex,
    age: p.age,
    height_cm: p.heightCm,
    weight_kg: p.weightKg,
    experience: p.experience,
    runs_per_week: p.runsPerWeek,
    injury_history: p.injuryHistory,
  });
  if (error) throw error;
}

export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase.from("goals").select("metric, min, max, target");
  if (error) throw error;
  return data.map((g) => ({
    metric: g.metric as MetricKey,
    min: Number(g.min),
    max: Number(g.max),
    target: g.target == null ? undefined : Number(g.target),
  }));
}

export async function saveGoals(g: Goal[]): Promise<void> {
  const id = await userId();
  const { error } = await supabase.from("goals").upsert(g.map((x) => ({ user_id: id, ...x })));
  if (error) throw error;
}

/**
 * Saved goals (from getGoals), with computeGoals' suggestion for any metric (or target) the user hasn't saved.
 * speedKmh: the scan's speed, so suggestions fit how fast they ran; omitted = default easy pace for their experience.
 */
export function goalsFor(p: Profile, saved: Goal[], speedKmh?: number): Goal[] {
  return Object.entries(computeGoals(toRunner(p, speedKmh))).map(([metric, g]) => {
    const s = saved.find((x) => x.metric === metric);
    return { metric: metric as MetricKey, min: s?.min ?? g.min, max: s?.max ?? g.max, target: s?.target ?? g.target };
  });
}

/** Form score (0–100) against the same goals the badges use (goalsFor at the scan's speed). */
export function scoreFor(p: Profile, goals: Goal[], s: Pick<Session, "metrics" | "treadmillSpeedKmh">) {
  const ranges = Object.fromEntries(goals.map((g) => [g.metric, { min: g.min, max: g.max, target: g.target ?? (g.min + g.max) / 2 }]));
  return scoreRun(toRunner(p), s.metrics, s.treadmillSpeedKmh, ranges as Record<MetricKey, { min: number; max: number; target: number }>);
}
