-- Part 4: row level security. Replaces the "is this the logged-in user's data?" check
-- you would write in Express middleware.

alter table profiles enable row level security;
alter table sessions enable row level security;
alter table goals enable row level security;

create policy "own profile" on profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own sessions" on sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own goals" on goals for all using (user_id = auth.uid()) with check (user_id = auth.uid());
