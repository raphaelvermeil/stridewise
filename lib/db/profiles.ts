// Part 4: onboarding answers and goals for the logged-in user. Browser-only (see sessions.ts).
import { supabase } from "@/lib/supabase/client";
import type { Goal, MetricKey } from "@/lib/types";
import type { Fitness, Injury, Runner, Sex } from "@/lib/Goal_value/computeGoals";

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
      injuryHistory: data.injury_history,
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
