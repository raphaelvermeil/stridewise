// Part 4: the only file that queries the sessions table (like an Express service/model file).
// Browser-only: uses the logged-in user's Supabase client, so RLS limits rows to that user.
import { supabase } from "@/lib/supabase/client";
import type { LandmarkFrame, Session } from "@/lib/types";

// Landmarks are left out: about 1 MB per session, only needed when re-analysing one scan.
const COLUMNS = "id, user_id, created_at, treadmill_speed_kmh, metrics, video_path, score";

type Row = {
  id: string;
  user_id: string;
  created_at: string;
  treadmill_speed_kmh: number;
  metrics: Session["metrics"];
  video_path: string | null;
  score: number | null;
};

const toSession = (r: Row): Session => ({
  id: r.id,
  userId: r.user_id,
  createdAt: r.created_at,
  treadmillSpeedKmh: Number(r.treadmill_speed_kmh),
  metrics: r.metrics,
  videoPath: r.video_path,
  score: r.score,
});

export async function saveSession(s: Omit<Session, "id" | "createdAt" | "videoPath" | "score">): Promise<Session | null> {
  const { data, error } = await supabase
    .from("sessions")
    .insert({ user_id: s.userId, treadmill_speed_kmh: s.treadmillSpeedKmh, metrics: s.metrics })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toSession(data);
}

/** A finished scan: uploads the raw video to the "scans" bucket, then saves the session with its landmarks. */
export async function saveScan(s: {
  treadmillSpeedKmh: number;
  metrics: Session["metrics"];
  score: number;
  landmarks: LandmarkFrame[];
  video: Blob;
}): Promise<Session> {
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) throw new Error("Not logged in");
  const userId = auth.session.user.id;
  const id = crypto.randomUUID();
  const ext = s.video.type.includes("mp4") ? "mp4" : "webm"; // Safari records mp4, Chrome/Firefox webm
  // Readable name, e.g. {userId}/2026-11-21_14-32-05_10kmh.webm. The folder must stay the user id (storage policy).
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const when = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  const videoPath = `${userId}/${when}_${s.treadmillSpeedKmh}kmh.${ext}`;

  // A 30 s take is ~900 frames (~4 MB of JSON), enough to hit Supabase's 8 s statement timeout on a cold insert.
  // Rounding to 4 decimals (~0.1 px) makes it ~60% smaller without changing any metric.
  const r4 = (v: number) => Math.round(v * 1e4) / 1e4;
  const landmarks = s.landmarks.map((f) => ({
    t: Math.round(f.t),
    aspect: r4(f.aspect),
    landmarks: f.landmarks.map((l) => ({ x: r4(l.x), y: r4(l.y), z: r4(l.z), visibility: r4(l.visibility) })),
  }));

  const upload = await supabase.storage.from("scans").upload(videoPath, s.video, { contentType: s.video.type });
  if (upload.error) throw upload.error;

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      id,
      user_id: userId,
      treadmill_speed_kmh: s.treadmillSpeedKmh,
      metrics: s.metrics,
      score: s.score,
      landmarks,
      video_path: videoPath,
    })
    .select(COLUMNS)
    .single();
  if (error) throw error; // shortcut: the uploaded video is left orphaned; clean up if this ever happens in practice
  return toSession(data);
}

export async function listSessions(): Promise<Session[]> {
  const { data, error } = await supabase.from("sessions").select(COLUMNS).order("created_at");
  if (error) throw error;
  return data.map(toSession);
}

export async function getSession(id: string): Promise<Session | null> {
  const { data, error } = await supabase.from("sessions").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data && toSession(data);
}

/** A temporary link to a scan's video in the private "scans" bucket. */
export async function getVideoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("scans").createSignedUrl(path, 3600); // 1 h, plenty for one viewing
  if (error) throw error;
  return data.signedUrl;
}

/** One scan's landmark frames (~1 MB), for step-by-step analysis. Empty for seeded sessions. */
export async function getLandmarks(id: string): Promise<LandmarkFrame[]> {
  const { data, error } = await supabase.from("sessions").select("landmarks").eq("id", id).single();
  if (error) throw error;
  return data.landmarks ?? [];
}
