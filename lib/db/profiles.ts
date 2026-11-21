// Part 4: onboarding answers and goals for the logged-in user.
import type { Goal } from "@/lib/types";

export type Profile = {
  heightCm: number;
  experience: string;
  runsPerWeek: number;
  injuryHistory: string;
};

export async function getProfile(): Promise<Profile | null> {
  return null;
}

export async function saveProfile(_p: Profile): Promise<void> {}

export async function getGoals(): Promise<Goal[]> {
  return [];
}

export async function saveGoals(_g: Goal[]): Promise<void> {}
