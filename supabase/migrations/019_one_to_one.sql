-- ============================================================================
-- Vitalcare Training Hub — Trainer 1:1 sessions (Phase 12)
-- Learner requests a 1:1 for a course -> admin approves + assigns a trainer and
-- time -> it lands on the trainer's (and learner's) calendar. is_staff() from 001.
-- ============================================================================

create table if not exists public.one_to_one_requests (
  id            uuid primary key default gen_random_uuid(),
  learner_id    uuid not null references public.profiles (id) on delete cascade,
  course_id     uuid references public.courses (id) on delete set null,
  trainer_id    uuid references public.profiles (id) on delete set null,
  preferred_at  timestamptz,
  scheduled_at  timestamptz,
  note          text,
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'declined', 'completed')),
  meet_url      text,
  created_at    timestamptz not null default now(),
  decided_by    uuid references public.profiles (id) on delete set null,
  decided_at    timestamptz
);
create index if not exists o2o_learner_idx on public.one_to_one_requests (learner_id);
create index if not exists o2o_trainer_idx on public.one_to_one_requests (trainer_id);
create index if not exists o2o_status_idx on public.one_to_one_requests (status);

alter table public.one_to_one_requests enable row level security;

-- Learner sees/creates own; assigned trainer sees theirs; staff manage all.
drop policy if exists o2o_select on public.one_to_one_requests;
create policy o2o_select on public.one_to_one_requests for select
  using (learner_id = auth.uid() or trainer_id = auth.uid() or public.is_staff());
drop policy if exists o2o_insert on public.one_to_one_requests;
create policy o2o_insert on public.one_to_one_requests for insert
  with check (learner_id = auth.uid());
drop policy if exists o2o_update on public.one_to_one_requests;
create policy o2o_update on public.one_to_one_requests for update
  using (public.is_staff()) with check (public.is_staff());
