-- Part 4: run in the Supabase SQL editor. Mirrors lib/types.ts.

create table profiles (
  user_id uuid primary key references auth.users on delete cascade,
  height_cm numeric,
  weight_kg numeric,
  experience text,
  runs_per_week int,
  injury_history text[] not null default '{}'
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  treadmill_speed_kmh numeric not null,
  metrics jsonb not null
);

create table goals (
  user_id uuid not null references auth.users on delete cascade,
  metric text not null,
  min numeric not null,
  max numeric not null,
  primary key (user_id, metric)
);
