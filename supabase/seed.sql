-- Part 4: demo account + 5 past sessions so the My Data charts have data.
-- Run in the Supabase SQL editor after schema.sql and policies.sql. Safe to re-run.
-- Login: demo@stridewise.app / stridewise-demo

create extension if not exists pgcrypto;

-- shortcut: inserts the auth user directly instead of via the Auth API; fine for one demo account.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'demo@stridewise.app',
  crypt('stridewise-demo', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'email',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"demo@stridewise.app","email_verified":true}',
  now(), now(), now()
) on conflict (provider_id, provider) do nothing;

insert into profiles (user_id, height_cm, weight_kg, experience, runs_per_week, injury_history)
values ('11111111-1111-1111-1111-111111111111', 178, 72, 'intermediate', 3, array['Shin splints (medial tibial stress syndrome)'])
on conflict (user_id) do nothing;

insert into goals (user_id, metric, min, max) values
  ('11111111-1111-1111-1111-111111111111', 'cadenceSpm', 170, 180),
  ('11111111-1111-1111-1111-111111111111', 'maxThighAngleDeg', 40, 55),
  ('11111111-1111-1111-1111-111111111111', 'overstrideRatio', 0, 0.2),
  ('11111111-1111-1111-1111-111111111111', 'torsoLeanDeg', 4, 10),
  ('11111111-1111-1111-1111-111111111111', 'elbowAngleDeg', 80, 100),
  ('11111111-1111-1111-1111-111111111111', 'headOffsetRatio', -0.05, 0.08),
  ('11111111-1111-1111-1111-111111111111', 'shinAngleDeg', 0, 8),
  ('11111111-1111-1111-1111-111111111111', 'groundContactMs', 200, 260)
on conflict (user_id, metric) do nothing;

-- Same speed (10 km/h) every session so they are comparable; form improves over ~6 weeks.
-- Fixed ids keep re-runs from duplicating rows.
insert into sessions (id, user_id, created_at, treadmill_speed_kmh, metrics) values
  ('22222222-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', now() - interval '42 days', 10,
   '{"cadenceSpm":158,"maxThighAngleDeg":36,"overstrideRatio":0.34,"torsoLeanDeg":1.5,"elbowAngleDeg":122,"headOffsetRatio":0.16,"shinAngleDeg":12,"groundContactMs":290}'),
  ('22222222-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', now() - interval '31 days', 10,
   '{"cadenceSpm":162,"maxThighAngleDeg":38,"overstrideRatio":0.29,"torsoLeanDeg":2.8,"elbowAngleDeg":112,"headOffsetRatio":0.13,"shinAngleDeg":10,"groundContactMs":278}'),
  ('22222222-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', now() - interval '21 days', 10,
   '{"cadenceSpm":166,"maxThighAngleDeg":41,"overstrideRatio":0.24,"torsoLeanDeg":4.1,"elbowAngleDeg":104,"headOffsetRatio":0.10,"shinAngleDeg":8,"groundContactMs":265}'),
  ('22222222-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', now() - interval '12 days', 10,
   '{"cadenceSpm":169,"maxThighAngleDeg":43,"overstrideRatio":0.21,"torsoLeanDeg":5.0,"elbowAngleDeg":97,"headOffsetRatio":0.07,"shinAngleDeg":6.5,"groundContactMs":254}'),
  ('22222222-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', now() - interval '3 days', 10,
   '{"cadenceSpm":172,"maxThighAngleDeg":45,"overstrideRatio":0.18,"torsoLeanDeg":5.6,"elbowAngleDeg":92,"headOffsetRatio":0.05,"shinAngleDeg":5,"groundContactMs":245}')
on conflict (id) do nothing;
