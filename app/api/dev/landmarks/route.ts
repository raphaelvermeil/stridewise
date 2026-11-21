// Part 1 dev tool: save extracted landmark frames to fixtures/landmarks/<date>_session-<n>.json.
// Local dev only — writes to the project folder, so it is disabled in production.
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), "fixtures/landmarks");

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") return new Response("Not found", { status: 404 });
  const frames = await req.json();
  if (!Array.isArray(frames) || !frames.length) return new Response("Expected a non-empty frame array", { status: 400 });

  const n = (await readdir(DIR)).filter((f) => /_session-\d+\.json$/.test(f)).length + 1;
  const date = new Date().toLocaleDateString("sv"); // YYYY-MM-DD, local time
  const name = `${date}_session-${n}.json`;
  await writeFile(path.join(DIR, name), JSON.stringify(frames));
  return Response.json({ name });
}
