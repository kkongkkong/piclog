-- Piclog staging only. DO NOT run against production.
-- Prerequisite: manually create a PRIVATE Storage bucket named 'photos' in piclog-staging.
-- Object names must start with <authenticated user uuid>/, e.g. <uid>/<uuid>.jpg.
-- Supabase Anonymous Auth sessions use the 'authenticated' Postgres role.

create policy "piclog_storage_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "piclog_storage_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "piclog_storage_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "piclog_storage_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Do not enable public bucket access. Use signed URLs for private photo display.
-- Do not upload production test-user photos to staging.
