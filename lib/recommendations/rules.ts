// Part 4: metric outside its goal -> what's off, a cue, and drills.
import type { Goal, SessionMetrics } from "@/lib/types";

export type Recommendation = { metric: keyof SessionMetrics; issue: string; cue: string; drills: string[] };

export function recommend(_m: SessionMetrics, _goals: Goal[]): Recommendation[] {
  return [];
}
