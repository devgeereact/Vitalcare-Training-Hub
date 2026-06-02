-- 036_mail_folders_labels.sql
-- Webmail folders, labels, importance and draft support for mail_messages.
-- Folders: inbox | sent | important (virtual, driven by `important`) | draft | trash.
-- Categories: work | private | support | social.

alter table public.mail_messages
  add column if not exists folder text not null default 'inbox',
  add column if not exists category text,
  add column if not exists important boolean not null default false,
  add column if not exists trashed_at timestamptz,
  add column if not exists to_addr text,
  add column if not exists is_draft boolean not null default false;

-- Constrain folder + category to known values (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mail_messages_folder_chk'
  ) then
    alter table public.mail_messages
      add constraint mail_messages_folder_chk
      check (folder in ('inbox', 'sent', 'draft', 'trash'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'mail_messages_category_chk'
  ) then
    alter table public.mail_messages
      add constraint mail_messages_category_chk
      check (category is null or category in ('work', 'private', 'support', 'social'));
  end if;
end $$;

create index if not exists mail_messages_owner_folder_idx
  on public.mail_messages (owner_id, folder);

-- Drafts and locally-composed sent copies need INSERT; staff can insert for the
-- shared mailbox (owner_id null) too. Keeps the existing SELECT/UPDATE policies.
drop policy if exists mail_insert on public.mail_messages;
create policy mail_insert on public.mail_messages
  for insert
  with check ((owner_id = auth.uid()) or ((owner_id is null) and public.is_staff()));

-- Allow hard delete for owned/shared rows (used for emptying trash).
drop policy if exists mail_delete on public.mail_messages;
create policy mail_delete on public.mail_messages
  for delete
  using ((owner_id = auth.uid()) or ((owner_id is null) and public.is_staff()));
