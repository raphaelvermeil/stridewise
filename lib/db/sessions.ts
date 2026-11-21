// Part 4: the only file that queries the sessions table (like an Express service/model file).
// Part 3 can return fake data from fixtures here until the real tables exist.
import type { Session } from "@/lib/types";

export async function saveSession(_s: Omit<Session, "id" | "createdAt">): Promise<Session | null> {
  return null;
}

export async function listSessions(): Promise<Session[]> {
  return [];
}

export async function getSession(_id: string): Promise<Session | null> {
  return null;
}
