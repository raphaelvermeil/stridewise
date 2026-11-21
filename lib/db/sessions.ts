// Part 4: the only file that queries the sessions table (like an Express service/model file).
// Browser-only: uses the logged-in user's Supabase client, so RLS limits rows to that user.
import { supabase } from "@/lib/supabase/client";
import type { Session } from "@/lib/types";

type Row = { id: string; user_id: string; created_at: string; treadmill_speed_kmh: number; metrics: Session["metrics"] };

const toSession = (r: Row): Session => ({
  id: r.id,
  userId: r.user_id,
  createdAt: r.created_at,
  treadmillSpeedKmh: Number(r.treadmill_speed_kmh),
  metrics: r.metrics,
});

export async function saveSession(s: Omit<Session, "id" | "createdAt">): Promise<Session | null> {
  const { data, error } = await supabase
    .from("sessions")
    .insert({ user_id: s.userId, treadmill_speed_kmh: s.treadmillSpeedKmh, metrics: s.metrics })
    .select()
    .single();
  if (error) throw error;
  return toSession(data);
}

export async function listSessions(): Promise<Session[]> {
  const { data, error } = await supabase.from("sessions").select().order("created_at");
  if (error) throw error;
  return data.map(toSession);
}

export async function getSession(id: string): Promise<Session | null> {
  const { data, error } = await supabase.from("sessions").select().eq("id", id).maybeSingle();
  if (error) throw error;
  return data && toSession(data);
}
