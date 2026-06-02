-- ============================================================================
-- Vitalcare Training Hub — Web-push on notification (Phase 10)
-- Every new notification also fires a web-push via the send-push Edge Function.
-- Uses pg_net for the async HTTP call. The CRON_SECRET is read from a locked
-- config table (app_config) so it never lives in source control.
-- ============================================================================

create extension if not exists pg_net;

-- Locked key/value config. RLS on, no policies -> no client access at all.
-- Security-definer functions and the service role can still read it.
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);
alter table public.app_config enable row level security;

create or replace function public.push_on_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  secret text;
begin
  select value into secret from public.app_config where key = 'cron_secret';
  if secret is null then
    return new; -- push not configured; in-app notification still stands
  end if;

  perform net.http_post(
    url := 'https://mongirnapzzizmzcrkqp.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_VmCIonQ2-mXxEgHrtXEIaw_wKWt4fEd',
      'x-cron-secret', secret
    ),
    body := jsonb_build_object(
      'userIds', jsonb_build_array(new.user_id),
      'title', new.title,
      'body', coalesce(new.body, ''),
      'url', coalesce(new.link, '/platform/notifications')
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_push_notification on public.notifications;
create trigger trg_push_notification
  after insert on public.notifications
  for each row execute function public.push_on_notification();
