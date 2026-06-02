insert into storage.buckets (id, name, public)
values ('files', 'files', false)
on conflict (id) do nothing;

drop policy if exists files_select on storage.objects;
create policy files_select on storage.objects for select
  using (bucket_id = 'files' and public.is_staff());
drop policy if exists files_insert on storage.objects;
create policy files_insert on storage.objects for insert
  with check (bucket_id = 'files' and public.is_staff());
drop policy if exists files_delete on storage.objects;
create policy files_delete on storage.objects for delete
  using (bucket_id = 'files' and public.is_staff());
