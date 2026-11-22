-- Form score (0–100, lib/Goal_value/scoreRun.ts) frozen when a scan is saved, so later profile edits don't rewrite history.
-- Run by hand in the Supabase SQL editor after scans.sql. Safe to re-run. Older/seeded sessions stay null and are scored live.
alter table sessions add column if not exists score int check (score between 0 and 100);
