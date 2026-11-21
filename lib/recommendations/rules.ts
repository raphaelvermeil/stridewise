// Part 4: metric outside its goal -> what's off, a cue, and drills.
import type { Goal, SessionMetrics } from "@/lib/types";

export type Recommendation = { metric: keyof SessionMetrics; issue: string; cue: string; drills: string[] };

type Advice = Omit<Recommendation, "metric">;

// Keyed by metric name (not MetricKey) so rules can exist for metrics Part 1 hasn't merged yet.
// A missing side (e.g. no `low`) means that direction isn't a form problem worth flagging.
const RULES: Record<string, { low?: Advice; high?: Advice }> = {
  cadenceSpm: {
    low: {
      issue: "Your cadence is below your goal, which usually means long, heavy strides.",
      cue: "Quick, light feet. Take slightly shorter steps.",
      drills: ["Run 3 × 3 min with a metronome 5% above your current cadence", "Quick-feet drill: 4 × 15 s", "4 × 20 s relaxed strides"],
    },
    high: {
      issue: "Your cadence is above your goal, so your steps may be short and choppy at this speed.",
      cue: "Relax and let your stride open up a little behind you.",
      drills: ["4 × 20 s strides focusing on pushing off the ground", "Bounding: 3 × 20 m"],
    },
  },
  maxThighAngleDeg: {
    low: {
      issue: "Low knee drive. Your stride is closer to a shuffle.",
      cue: "Drive your knee forward, not up.",
      drills: ["A-skips: 3 × 20 m", "High knees: 3 × 15 s", "Standing wall knee drives: 3 × 10 per leg"],
    },
    high: {
      issue: "Your knee lift is higher than this speed needs, which costs energy.",
      cue: "Keep the knee relaxed and focus on pushing the ground back.",
      drills: ["4 × 20 s easy strides focusing on push-off", "Butt kicks: 3 × 15 s"],
    },
  },
  overstrideRatio: {
    high: {
      issue: "Your foot lands well ahead of your hips. That brakes every step and loads your knees and shins.",
      cue: "Land with your foot under your hips.",
      drills: ["Raise cadence by 5% with a metronome", "Wall drill: 3 × 10 per leg", "Falling starts: 4 × 15 m"],
    },
  },
  torsoLeanDeg: {
    low: {
      issue: "You run upright or lean back, which works against forward momentum.",
      cue: "Lean slightly forward from the ankles, not the waist.",
      drills: ["Wall lean drill: 3 × 30 s", "Falling starts: 4 × 15 m"],
    },
    high: {
      issue: "You lean too far forward, often by bending at the waist. This strains your lower back.",
      cue: "Run tall and push your hips forward.",
      drills: ["Plank: 3 × 30 s", "Glute bridges: 3 × 12", "Hip flexor stretch: 2 × 30 s per side"],
    },
  },
  elbowAngleDeg: {
    low: {
      issue: "Your arms are bent tightly, which usually comes with shoulder tension.",
      cue: "Drop your shoulders and open your elbows a little.",
      drills: ["Shoulder shrug-and-drop while running: 5 × 10 s", "Seated arm swings: 3 × 30 s"],
    },
    high: {
      issue: "Your arms are too straight, which makes the arm swing long and slow.",
      cue: "Bend your elbows to about 90° and swing from the shoulder.",
      drills: ["Seated arm swings at 90°: 3 × 30 s", "Run 2 × 1 min lightly holding a rolled-up sock in each hand"],
    },
  },
  headOffsetRatio: {
    low: {
      issue: "Your head is tilted back behind your shoulders.",
      cue: "Keep your chin neutral and look forward.",
      drills: ["Chin tucks: 2 × 10"],
    },
    high: {
      issue: "Your head pokes forward, which strains your neck and upper back.",
      cue: "Keep your ears over your shoulders and look about 20 m ahead.",
      drills: ["Chin tucks: 2 × 10", "Wall angels: 2 × 10"],
    },
  },
  shinAngleDeg: {
    high: {
      issue: "Your shin reaches out in front of your knee at landing, which is a sign of overstriding.",
      cue: "Let your foot land under your knee.",
      drills: ["Wall drill: 3 × 10 per leg", "Raise cadence by 5% with a metronome"],
    },
  },
  groundContactMs: {
    high: {
      issue: "Your feet stay on the ground a long time, so you lose springiness.",
      cue: "Think of the ground as hot. Get off it quickly.",
      drills: ["Pogo hops: 3 × 20", "Skipping rope: 3 × 30 s", "A-skips: 3 × 20 m"],
    },
  },
};

export function recommend(m: SessionMetrics, goals: Goal[]): Recommendation[] {
  return goals.flatMap((g) => {
    const v = m[g.metric];
    const side = v < g.min ? "low" : v > g.max ? "high" : null;
    const advice = side && RULES[g.metric]?.[side];
    return advice ? [{ metric: g.metric, ...advice }] : [];
  });
}
