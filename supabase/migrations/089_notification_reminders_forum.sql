-- More notifications: session "starting soon" reminders (scheduled), forum
-- replies, and department task assignment. Each deep-links to the item.
-- Deploy: supabase db push

-- ── Session starting-soon reminders (cron) ──────────────────────────────────
-- Dedup table so each session is reminded once.
create table if not exists public.session_reminders (
  session_id uuid primary key references public.training_sessions(id) on delete cascade,
  reminded_at timestamptz not null default now()
);
alter table public.session_reminders enable row level security;
-- No client access needed; staff may read for debugging.
drop policy if exists session_reminders_read on public.session_reminders;
create policy session_reminders_read on public.session_reminders for select
  using (private.is_staff());

create or replace function public.notify_session_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare s record;
begin
  for s in
    select ts.id, ts.title
    from public.training_sessions ts
    where ts.deleted_at is null
      and ts.status = 'scheduled'
      and ts.starts_at between now() and now() + interval '30 minutes'
      and not exists (select 1 from public.session_reminders r where r.session_id = ts.id)
  loop
    insert into public.notifications (user_id, type, title, body, link)
    select b.learner_id, 'session', 'Session starting soon',
      s.title || ' starts within 30 minutes.', '/platform/sessions/' || s.id
    from public.session_bookings b
    where b.session_id = s.id and b.deleted_at is null;
    insert into public.session_reminders (session_id) values (s.id)
      on conflict (session_id) do nothing;
  end loop;
end;
$$;

-- Schedule every 15 minutes (guarded re-schedule, same pattern as cert expiry).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'session-start-reminders') then
    perform cron.unschedule('session-start-reminders');
  end if;
end $$;
select cron.schedule('session-start-reminders', '*/15 * * * *', $$
  select public.notify_session_reminders();
$$);

-- ── Forum replies ───────────────────────────────────────────────────────────
-- Notify the thread author and everyone who has posted, except the new author.
create or replace function public.notify_on_forum_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_title text;
begin
  select title into v_title from public.forum_threads where id = new.thread_id;
  insert into public.notifications (user_id, type, title, body, link)
  select distinct parts.uid, 'info',
    'New reply: ' || coalesce(v_title, 'a topic'),
    left(coalesce(new.body, ''), 120),
    '/platform/forums/' || new.thread_id
  from (
    select author_id as uid from public.forum_threads where id = new.thread_id
    union
    select author_id from public.forum_posts where thread_id = new.thread_id and deleted_at is null
  ) parts
  where parts.uid is not null
    and parts.uid <> coalesce(new.author_id, '00000000-0000-0000-0000-000000000000'::uuid);
  return new;
end;
$$;
drop trigger if exists trg_notify_forum_post on public.forum_posts;
create trigger trg_notify_forum_post after insert on public.forum_posts
  for each row execute function public.notify_on_forum_post();

-- ── Department task assigned ────────────────────────────────────────────────
create or replace function public.notify_on_dept_task()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignee_id is not null
     and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id) then
    insert into public.notifications (user_id, type, title, body, link)
    values (new.assignee_id, 'info', 'Task assigned to you', new.title,
      '/platform/departments');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_notify_dept_task on public.department_tasks;
create trigger trg_notify_dept_task after insert or update on public.department_tasks
  for each row execute function public.notify_on_dept_task();
