alter table public.training_sessions
  add column if not exists recording_url text,
  add column if not exists zoom_start_url text;
