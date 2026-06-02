-- ============================================================================
-- Vitalcare Training Hub — Course media (Phase 11)
-- Featured images + lesson file uploads, stored in a public Storage bucket.
-- ============================================================================

-- Featured image on courses (LearnPress: post thumbnail).
alter table public.courses add column if not exists thumbnail_url text;

-- Public bucket for course imagery and lesson documents/video.
insert into storage.buckets (id, name, public)
values ('course-media', 'course-media', true)
on conflict (id) do update set public = true;

-- Anyone can read (public bucket); staff can upload/update/remove.
drop policy if exists course_media_read on storage.objects;
create policy course_media_read on storage.objects for select
  using (bucket_id = 'course-media');

drop policy if exists course_media_write on storage.objects;
create policy course_media_write on storage.objects for insert
  with check (bucket_id = 'course-media' and public.is_staff());

drop policy if exists course_media_update on storage.objects;
create policy course_media_update on storage.objects for update
  using (bucket_id = 'course-media' and public.is_staff());

drop policy if exists course_media_delete on storage.objects;
create policy course_media_delete on storage.objects for delete
  using (bucket_id = 'course-media' and public.is_staff());
