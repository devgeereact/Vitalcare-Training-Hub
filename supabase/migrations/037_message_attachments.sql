-- 037_message_attachments.sql
-- Optional file attachment on a direct chat message (Supabase Storage URL).

alter table public.messages
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text;
