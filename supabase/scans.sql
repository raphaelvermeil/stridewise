-- Part 4: store each scan's raw video and landmark frames. Run after schema.sql and policies.sql. Safe to re-run.
-- The skeleton is not burned into the video: playback redraws it from the landmarks (or live with PoseOverlay).

alter table sessions add column if not exists video_path text; -- object path in the "scans" bucket, null for seeded sessions
alter table sessions add column if not exists landmarks jsonb; -- LandmarkFrame[], t = ms from the start of the video

-- Private bucket: videos are only reachable through signed URLs.
insert into storage.buckets (id, name, public) values ('scans', 'scans', false) on conflict (id) do nothing;

-- Each user can only touch files under their own folder: scans/{user_id}/...
drop policy if exists "own scans" on storage.objects;
create policy "own scans" on storage.objects for all to authenticated
  using (bucket_id = 'scans' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'scans' and (storage.foldername(name))[1] = auth.uid()::text);
