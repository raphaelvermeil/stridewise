# CodeJam 2026: running form analysis

Next.js (React + TypeScript) app. Pose detection and metrics run in the browser with MediaPipe; Supabase handles auth and the database.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

In Supabase, run `supabase/schema.sql` then `supabase/policies.sql` in the SQL editor.

## Where things live

| Folder | Runs in | Owner | What goes there |
|---|---|---|---|
| `lib/types.ts` | both | everyone | The two shared formats: landmark frames and the session record. Change only as a team. |
| `lib/pose/` | browser | Part 1 | MediaPipe setup, video → landmark frames, camera check |
| `lib/metrics/` | browser | Part 1 | Landmark frames → cadence, angles, overstride. `analyze()` is the entry point. |
| `app/scan/`, `components/scan/`, `lib/voice.ts` | browser | Part 2 | Camera check, recording, upload, skeleton overlay, voice prompts |
| `app/results/`, `app/my-data/`, `app/goals/`, `components/results/`, `components/dashboard/` | browser | Part 3 | Results screen, charts, goal editing |
| `app/(auth)/`, `app/onboarding/`, `lib/db/`, `lib/supabase/`, `lib/recommendations/`, `supabase/` | browser + database | Part 4 | Auth, onboarding, all database queries, recommendation rules, schema |
| `app/api/` | server | Part 4 | Express-style endpoints, only for things needing a secret key (LLM explanations) |
| `fixtures/clips/` | – | everyone | Recorded treadmill videos (git-ignored, share via Drive) |
| `fixtures/landmarks/` | – | Part 1 | Landmark JSON exported from the clips, for testing metrics and for fake data |

## Rules of thumb

- Only `lib/db/` talks to Supabase. Pages and components call its functions, never `supabase` directly.
- Only `lib/metrics/` does metric math. Components display numbers, they don't compute them.
- Work against `lib/types.ts` with fake data until the real piece you depend on is ready.
