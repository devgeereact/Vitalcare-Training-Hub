-- Virtual training: learners must request to join a live session and be
-- approved by an admin before they can join. The meeting link is never handed
-- to an unapproved learner: it is fetched through a security-definer function
-- that checks approval, so a link cannot be shared ahead of approval.
-- Deploy: supabase db push

create table if not exists public.session_join_requests (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.training_sessions(id) on delete cascade,
  learner_id  uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'pending'
              check (status in ('pending', 'approved', 'declined')),
  decided_by  uuid references public.profiles(id) on delete set null,
  decided_at  timestamptz,
  created_at  timestamptz not null default now(),
  unique (session_id, learner_id)
);
create index if not exists sjr_session_idx on public.session_join_requests (session_id);
create index if not exists sjr_learner_idx on public.session_join_requests (learner_id);
create index if not exists sjr_status_idx on public.session_join_requests (status);

alter table public.session_join_requests enable row level security;

-- Learners see their own requests; staff see all.
-- NB: the RLS helpers live in the `private` schema (migration 056 moved them
-- out of public), so reference them as private.is_staff() / private.is_admin().
drop policy if exists sjr_select on public.session_join_requests;
create policy sjr_select on public.session_join_requests for select
  using (learner_id = auth.uid() or private.is_staff());

-- A learner may raise a request only for themselves.
drop policy if exists sjr_insert on public.session_join_requests;
create policy sjr_insert on public.session_join_requests for insert
  with check (learner_id = auth.uid());

-- Only admins / super_admins approve or decline.
drop policy if exists sjr_update on public.session_join_requests;
create policy sjr_update on public.session_join_requests for update
  using (private.is_admin()) with check (private.is_admin());

-- Return a session's join links only to staff, or to a learner with an approved
-- request for a session that has not yet ended. Otherwise return nothing, so an
-- unapproved learner can never read the link (and so cannot share it).
create or replace function public.get_session_join_link(p_session_id uuid)
returns table (meet_url text, zoom_join_url text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if private.is_staff() or exists (
    select 1
    from public.session_join_requests r
    join public.training_sessions s on s.id = r.session_id
    where r.session_id = p_session_id
      and r.learner_id = auth.uid()
      and r.status = 'approved'
      and s.ends_at >= now()
  ) then
    return query
      select s.meet_url, s.zoom_join_url
      from public.training_sessions s
      where s.id = p_session_id;
  end if;
  return;
end;
$$;

revoke execute on function public.get_session_join_link(uuid) from public;
grant execute on function public.get_session_join_link(uuid) to authenticated;
