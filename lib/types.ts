// The two shared formats every part codes against. Agree on these in hour 1, then change them only as a team.

// ---- 1. Landmark frames (Part 1 produces, Parts 2 and 3 consume) ----

/** One MediaPipe body point. x, y are 0..1 of the frame width/height. */
export type Landmark = { x: number; y: number; z: number; visibility: number };

/** One video frame: 33 MediaPipe pose landmarks + timestamp in ms + video width/height (to scale x so angles are true). */
export type LandmarkFrame = { t: number; aspect: number; landmarks: Landmark[] };

// ---- 2. Session record (Part 1 produces metrics, Part 4 stores, Part 3 displays) ----

export type SessionMetrics = {
  cadenceSpm: number; // steps per minute
  maxThighAngleDeg: number; // knee drive, thigh angle from vertical
  overstrideRatio: number; // foot-to-hip distance at contact / leg length
  torsoLeanDeg: number; // from vertical, + = forward
  elbowAngleDeg: number;
  headOffsetRatio: number; // ear ahead of shoulder / torso length
  shinAngleDeg: number; // at foot contact, from vertical, + = ankle ahead of knee
  groundContactMs: number; // approximate: ±1 frame per step at 30 fps
  verticalOscillationCm: number; // hip rise and fall per step, scaled by the runner's height
};

export type Session = {
  id: string;
  userId: string;
  createdAt: string; // ISO date
  treadmillSpeedKmh: number;
  metrics: SessionMetrics;
  score: number | null; // form score 0–100 when saved (scoreRun); null for older/seeded sessions
  videoPath: string | null; // in the private "scans" bucket; null for seeded sessions. Landmarks are stored too but not loaded here (large).
};

export type MetricKey = keyof SessionMetrics;

/** One point on the end-of-session graph (Part 1 analyzeOverTime → Part 3 charts). t = landing time in ms. */
export type MetricPoint = SessionMetrics & { t: number };

export type Goal = { metric: MetricKey; min: number; max: number; target?: number }; // target: from computeGoals; missing on older goals
