-- Part 4: profile fields for lib/Goal_value/computeGoals.ts, and a target value per goal.
-- Run by hand in the Supabase SQL editor after schema.sql and policies.sql. Safe to re-run.

alter table profiles add column if not exists weight_kg numeric; -- in schema.sql since the weight commit; older databases lack it
alter table profiles add column if not exists sex text check (sex in ('male', 'female'));
alter table profiles add column if not exists age int check (age between 10 and 100);
-- experience stays a text column; it now holds a Fitness value: beginner | intermediate | advanced | elite.
-- injury_history stays text[]; it now holds Injury keys: knee, shin, stressFracture, achilles, plantarFascia, hamstring, hip, lowBack.

alter table goals add column if not exists target numeric; -- null for goals saved before computeGoals existed
