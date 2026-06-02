-- Cleaner mail bodies + attachments (populated by the off-edge IMAP worker).
alter table public.mail_messages
  add column if not exists body_text text,
  add column if not exists has_attachments boolean not null default false,
  add column if not exists attachments jsonb not null default '[]'::jsonb;
