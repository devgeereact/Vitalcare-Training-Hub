# SQL Editor runbook

Everything below is meant to be pasted into the **Supabase SQL Editor** for
project `mongirnapzzizmzcrkqp`, in order, one step at a time.

Dashboard → SQL Editor → New query → paste → **Run**.

Work through the steps in order and read the result of each before moving on.
Every script is idempotent: running one twice does nothing the second time, so a
step that half-succeeded can simply be run again.

**Do not paste steps 2 and 3 together.** Run them separately so that if one
fails you know which.

---

## Contents

| Step | What it does | Reversible |
|------|--------------|------------|
| [1](#step-1--before-you-start) | Pre-flight checks. Reads only, changes nothing. | n/a |
| [2](#step-2--migration-092-authorisation-and-integrity) | Organisation scoping, unique constraints, course archival, order and coupon integrity. | Mostly. See [step 6](#step-6--if-something-goes-wrong). |
| [3](#step-3--migration-093-assessment-guards-and-certificate-expiry) | Assessment enrolment and attempt-cap guards, certificate expiry. | Yes. |
| [4](#step-4--verify) | Confirms both applied correctly. Reads only. | n/a |
| [4b](#step-4b--record-that-these-were-applied) | Tells the migration system they ran. Bookkeeping. | Yes. |
| [5](#step-5--the-one-decision-only-you-can-make) | Set renewal periods on courses. | Yes. |
| [6](#step-6--if-something-goes-wrong) | Rollback notes. | n/a |

After step 4 passes, tell me and I will re-run the test suites with the gated
assertions turned on.

---

## Step 1 — Before you start

Reads only. Run it and keep the output; step 4 compares against it.

```sql
-- 1a. Which migrations does the project think it has?
--     The last row should be 091. If 092 or 093 already appear, stop and tell me.
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 6;

-- 1b. Row counts before, so you can see nothing was lost.
select 'profiles'              as table_name, count(*) from public.profiles
union all select 'organisations',            count(*) from public.organisations
union all select 'courses',                  count(*) from public.courses
union all select 'enrollments',              count(*) from public.enrollments
union all select 'assessment_attempts',      count(*) from public.assessment_attempts
union all select 'learner_certificates',     count(*) from public.learner_certificates
union all select 'orders',                   count(*) from public.orders
union all select 'coupons',                  count(*) from public.coupons;

-- 1c. Profiles with no organisation. Step 2 assigns these to the default
--     organisation, so note how many there are.
select count(*) as profiles_without_organisation
from public.profiles
where organisation_id is null;

-- 1d. Duplicates that would stop the new unique indexes being created.
--     BOTH of these must return zero rows. If either returns anything,
--     send me the output and do not run step 2 yet.
select learner_id, course_id, count(*)
from public.learner_certificates
where deleted_at is null and course_id is not null
group by learner_id, course_id
having count(*) > 1;

select learner_id, course_id, count(*)
from public.enrollments
where deleted_at is null
group by learner_id, course_id
having count(*) > 1;
```

**Expected:** `1d` returns no rows at all. Everything else is just a record of
where you started.

---

## Step 2 — Migration 092: authorisation and integrity

Paste the whole block below and run it once.

It takes a few seconds. Success looks like `Success. No rows returned`.

<details>
<summary><strong>What this changes, in plain terms</strong></summary>

- Staff can no longer read learner records outside their own organisation.
  `super_admin` still sees everything. There is one organisation today, so
  nothing visible changes; it matters the day a second client is onboarded.
- Every profile gets an organisation, including the six that have none.
- Two unique indexes make duplicate certificates and duplicate enrolments
  impossible, so two browser tabs cannot create two of either.
- Order confirmation and coupon counting move into locking server functions.
  A coupon is counted once per order instead of once at checkout and again at
  confirmation, and re-confirming a paid order now does nothing.
- Adds the four functions the course archive and delete interface calls. That
  feature currently fails with an error because they do not exist yet.

</details>

### If your first attempt failed here

You will have seen:

```
ERROR:  P0001: Not allowed to change privileged profile fields
CONTEXT:  PL/pgSQL function guard_profile_privileged_cols() line 24 at RAISE
```

That was a real defect, now fixed inside the script below. A trigger from
migration 064 refuses any change to a profile's role or organisation unless the
caller is an admin, and it works that out from `auth.uid()`. The SQL Editor has
no signed-in user, so it was refused.

The same trigger has been silently breaking bulk learner import: the
`admin-create-learners` function sets each new learner's organisation with the
service_role key, which also has no `auth.uid()`, and it never checked whether
the write succeeded. So any learner imported with an organisation has not had
one assigned.

The script now teaches the trigger to allow a caller with no end-user session at
all, before it does the backfill. That is not a weakening: those callers bypass
row-level security anyway and are trusted absolutely, while every request that
does carry a session is still gated by row-level security first.

**Just run the script below again from the top.** It is idempotent, so whatever
part of it succeeded the first time is simply reapplied.

```sql
-- 092_authorisation_and_integrity.sql
--
-- Deploy: supabase db push
--
-- Four related problems, all of them "the database trusts the caller more than
-- it should" or "the database lets two callers race":
--
--   1. Organisation scoping. is_staff() is global, so a trainer or an
--      organisation administrator could read every learner's certificates,
--      enrolments, attempts and attendance across every organisation. There is
--      only one organisation today, so this is a latent hole rather than a live
--      breach, but it becomes a breach the day a second client is onboarded.
--
--   2. Unassigned profiles. handle_new_user() left organisation_id null, so
--      self-registered learners belonged to no organisation at all. Scoping
--      cannot work until every profile has an organisation.
--
--   3. Racing writes. Certificate issuance, coupon redemption, order
--      confirmation and enrolment were all check-then-write from the browser,
--      so two concurrent callers could produce duplicate certificates,
--      duplicate enrolments, or a coupon counted twice (once at checkout, again
--      at confirmation) while blowing past max_uses.
--
--   4. Course removal. There was no server-side path to withdraw a course, so
--      a mis-created course could never leave the catalogue.
--
-- Everything here is idempotent and safe to re-run.

-- ===========================================================================
-- 1. Organisation helpers
-- ===========================================================================

-- The provider's own organisation: the oldest one on the account. Used as the
-- default for profiles created without an explicit organisation.
create or replace function private.default_organisation_id()
returns uuid
language sql
stable
security definer
set search_path = private, public
as $$
  select id from public.organisations
  where deleted_at is null
  order by created_at asc
  limit 1;
$$;

-- The caller's own organisation.
create or replace function private.current_organisation_id()
returns uuid
language sql
stable
security definer
set search_path = private, public
as $$
  select organisation_id from public.profiles where id = auth.uid();
$$;

-- May the caller see records belonging to this person?
--
-- A super_admin runs the platform and sees every organisation. Everyone else is
-- confined to their own organisation, and to themselves when they have none.
create or replace function private.same_org(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select case
    when p_user is null then false
    when p_user = auth.uid() then true
    when private.is_super_admin() then true
    else coalesce(
      (select p.organisation_id from public.profiles p where p.id = p_user)
        is not distinct from private.current_organisation_id()
      and private.current_organisation_id() is not null,
      false)
  end;
$$;

-- Staff, confined to their own organisation. This is the predicate every
-- learner-personal table should use in place of a bare is_staff().
create or replace function private.staff_for(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public
as $$
  select private.is_staff() and private.same_org(p_user);
$$;

grant execute on function private.default_organisation_id() to anon, authenticated;
grant execute on function private.current_organisation_id() to anon, authenticated;
grant execute on function private.same_org(uuid) to anon, authenticated;
grant execute on function private.staff_for(uuid) to anon, authenticated;

-- ===========================================================================
-- 2. Every profile belongs to an organisation
-- ===========================================================================

-- 2a. First, unblock server-side writes to privileged profile columns.
--
-- guard_profile_privileged_cols (migration 064) refuses any change to role,
-- organisation or verification unless private.is_admin() or
-- private.is_super_admin() returns true. Both read auth.uid(), so both are
-- false for any caller with no end-user session: a migration running in the SQL
-- editor, a scheduled job, or the service_role key an Edge Function uses.
--
-- That is an accident rather than a policy, and it is already breaking things.
-- admin-create-learners sets organisation_id on each new learner through the
-- service_role client, so bulk learner import has been silently failing to
-- assign an organisation, and it does not check the error. The backfill below
-- hits the same wall.
--
-- Admitting a session-less caller is not a weakening. The guard exists to stop
-- a learner's own JWT editing privileged columns, and row-level security still
-- gates every request that carries one: profiles_update_own requires
-- id = auth.uid(), which is false when auth.uid() is null. The only callers
-- this admits are the ones that bypass row-level security anyway and are
-- trusted absolutely.
create or replace function public.guard_profile_privileged_cols()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  -- No end-user session: service_role, a migration, or a scheduled job.
  if auth.uid() is null then
    return new;
  end if;

  -- Super admins can change anything.
  if private.is_super_admin() then
    return new;
  end if;

  -- Admins and managers may change role and organisation, but not verification.
  if private.is_admin() then
    if new.is_verified is distinct from old.is_verified
       or new.verified_at is distinct from old.verified_at
       or new.verified_by is distinct from old.verified_by then
      raise exception 'Only a super admin may change verification';
    end if;
    return new;
  end if;

  -- Everyone else: privileged columns must not change.
  if new.role is distinct from old.role
     or new.is_verified is distinct from old.is_verified
     or new.verified_at is distinct from old.verified_at
     or new.verified_by is distinct from old.verified_by
     or new.organisation_id is distinct from old.organisation_id then
    raise exception 'Not allowed to change privileged profile fields';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_profile_privileged_cols()
  from public, anon, authenticated;

-- 2b. Assign the profiles that have no organisation.
update public.profiles
set organisation_id = private.default_organisation_id()
where organisation_id is null
  and private.default_organisation_id() is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role, organisation_id)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'first_name',
      split_part(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ' ', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'last_name',
      nullif(substr(
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        strpos(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ' ') + 1
      ), '')
    ),
    'learner',
    private.default_organisation_id()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- 3. Organisation-scoped read policies on learner-personal tables
-- ===========================================================================

-- Certificates: own, or staff in the same organisation.
drop policy if exists certs_select on public.learner_certificates;
create policy certs_select on public.learner_certificates for select
  using (learner_id = (select auth.uid()) or private.staff_for(learner_id));

drop policy if exists certs_insert on public.learner_certificates;
create policy certs_insert on public.learner_certificates for insert
  with check (private.staff_for(learner_id));

drop policy if exists certs_update on public.learner_certificates;
create policy certs_update on public.learner_certificates for update
  using (private.is_admin() and private.same_org(learner_id))
  with check (private.is_admin() and private.same_org(learner_id));

drop policy if exists certs_delete on public.learner_certificates;
create policy certs_delete on public.learner_certificates for delete
  using (private.is_admin() and private.same_org(learner_id));

-- Enrolments.
drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select
  using (learner_id = (select auth.uid()) or private.staff_for(learner_id));

-- Lesson progress.
drop policy if exists lesson_progress_select on public.lesson_progress;
create policy lesson_progress_select on public.lesson_progress for select
  using (learner_id = (select auth.uid()) or private.staff_for(learner_id));

-- Assessment attempts and their answers.
drop policy if exists attempts_select on public.assessment_attempts;
create policy attempts_select on public.assessment_attempts for select
  using (learner_id = (select auth.uid()) or private.staff_for(learner_id));

drop policy if exists answers_select on public.attempt_answers;
create policy answers_select on public.attempt_answers for select
  using (
    exists (
      select 1 from public.assessment_attempts a
      where a.id = attempt_answers.attempt_id
        and (a.learner_id = (select auth.uid()) or private.staff_for(a.learner_id))
    )
  );

-- Attendance and bookings.
drop policy if exists attendance_select on public.attendance_records;
create policy attendance_select on public.attendance_records for select
  using (learner_id = (select auth.uid()) or private.staff_for(learner_id));

drop policy if exists bookings_select on public.session_bookings;
create policy bookings_select on public.session_bookings for select
  using (learner_id = (select auth.uid()) or private.staff_for(learner_id));


-- A policy declared FOR ALL grants SELECT as well, so a blanket
-- "staff can do anything" policy silently re-opens every scoped read above.
-- Split each of them into the write commands they were actually for.
drop policy if exists enrollments_write on public.enrollments;
drop policy if exists enrollments_insert_staff on public.enrollments;
create policy enrollments_insert_staff on public.enrollments for insert
  with check (private.staff_for(learner_id));
drop policy if exists enrollments_update_staff on public.enrollments;
create policy enrollments_update_staff on public.enrollments for update
  using (private.staff_for(learner_id)) with check (private.staff_for(learner_id));
drop policy if exists enrollments_delete_staff on public.enrollments;
create policy enrollments_delete_staff on public.enrollments for delete
  using (private.staff_for(learner_id));

drop policy if exists lesson_progress_write on public.lesson_progress;
drop policy if exists lesson_progress_insert_own on public.lesson_progress;
create policy lesson_progress_insert_own on public.lesson_progress for insert
  with check (learner_id = (select auth.uid()));
drop policy if exists lesson_progress_update_own on public.lesson_progress;
create policy lesson_progress_update_own on public.lesson_progress for update
  using (learner_id = (select auth.uid()))
  with check (learner_id = (select auth.uid()));
drop policy if exists lesson_progress_delete_own on public.lesson_progress;
create policy lesson_progress_delete_own on public.lesson_progress for delete
  using (learner_id = (select auth.uid()));

drop policy if exists attendance_write on public.attendance_records;
drop policy if exists attendance_delete_staff on public.attendance_records;
create policy attendance_delete_staff on public.attendance_records for delete
  using (private.staff_for(learner_id));

drop policy if exists answers_write on public.attempt_answers;
drop policy if exists answers_insert_own on public.attempt_answers;
create policy answers_insert_own on public.attempt_answers for insert
  with check (
    exists (
      select 1 from public.assessment_attempts a
      where a.id = attempt_answers.attempt_id
        and (a.learner_id = (select auth.uid()) or private.staff_for(a.learner_id))
    )
  );
drop policy if exists answers_update_staff on public.attempt_answers;
create policy answers_update_staff on public.attempt_answers for update
  using (
    exists (
      select 1 from public.assessment_attempts a
      where a.id = attempt_answers.attempt_id and private.staff_for(a.learner_id)
    )
  )
  with check (
    exists (
      select 1 from public.assessment_attempts a
      where a.id = attempt_answers.attempt_id and private.staff_for(a.learner_id)
    )
  );
drop policy if exists answers_delete_staff on public.attempt_answers;
create policy answers_delete_staff on public.attempt_answers for delete
  using (
    exists (
      select 1 from public.assessment_attempts a
      where a.id = attempt_answers.attempt_id and private.staff_for(a.learner_id)
    )
  );

-- Attempts: staff must not be able to rewrite a learner's result outside the
-- server-side grading function, and must stay inside their own organisation.
drop policy if exists attempts_update on public.assessment_attempts;
create policy attempts_update on public.assessment_attempts for update
  to authenticated
  using (private.staff_for(learner_id))
  with check (private.staff_for(learner_id));

-- Profiles: yourself, or staff in your organisation. A super_admin still sees
-- everyone, which is what runs the platform.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = (select auth.uid()) or private.staff_for(id));

-- ===========================================================================
-- 4. Constraints that make the racing writes impossible
-- ===========================================================================

-- One live certificate per learner per course. Without this the "select then
-- insert" inside issue_course_certificate can produce two certificates when a
-- learner finishes the last lesson in two tabs at once.
create unique index if not exists lc_learner_course_uidx
  on public.learner_certificates (learner_id, course_id)
  where deleted_at is null and course_id is not null;

-- One live enrolment per learner per course.
create unique index if not exists enrollments_learner_course_uidx
  on public.enrollments (learner_id, course_id)
  where deleted_at is null;

-- Coupon redemptions are recorded per order, so a coupon can be counted once
-- and once only however many times the checkout or confirmation path runs.
create table if not exists public.coupon_redemptions (
  id         uuid primary key default gen_random_uuid(),
  coupon_id  uuid not null references public.coupons (id) on delete cascade,
  order_id   uuid not null references public.orders (id) on delete cascade,
  redeemed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

alter table public.coupon_redemptions enable row level security;
drop policy if exists coupon_redemptions_select on public.coupon_redemptions;
create policy coupon_redemptions_select on public.coupon_redemptions for select
  using (private.is_staff() or redeemed_by = (select auth.uid()));
-- Writes only ever happen inside the SECURITY DEFINER functions below.

-- ===========================================================================
-- 5. Race-proof certificate issuance
-- ===========================================================================

create or replace function public.issue_course_certificate(p_course uuid)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid      uuid := auth.uid();
  v_total    integer;
  v_done     integer;
  v_assess   uuid;
  v_passed   integer;
  v_existing uuid;
  v_cpd      numeric;
  v_cert     uuid;
begin
  if v_uid is null then
    return null;
  end if;

  if not exists (
    select 1 from public.enrollments
    where course_id = p_course and learner_id = v_uid and deleted_at is null
  ) then
    return null;
  end if;

  select count(*) into v_total
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where m.course_id = p_course
    and l.deleted_at is null
    and m.deleted_at is null;
  if v_total = 0 then
    return null;
  end if;

  select count(*) into v_done
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  join public.modules m on m.id = l.module_id
  where m.course_id = p_course
    and lp.learner_id = v_uid
    and lp.completed = true
    and l.deleted_at is null
    and m.deleted_at is null;
  if v_done < v_total then
    return null;
  end if;

  select id into v_assess
  from public.assessments
  where course_id = p_course and is_published = true and deleted_at is null
  limit 1;
  if v_assess is not null then
    select count(*) into v_passed
    from public.assessment_attempts
    where assessment_id = v_assess and learner_id = v_uid and passed = true;
    if v_passed = 0 then
      return null;
    end if;
  end if;

  select cpd_hours into v_cpd from public.courses where id = p_course;

  -- Idempotent by constraint, not by an earlier read: two concurrent callers
  -- both reach the insert, one wins, and the loser falls through to the select.
  insert into public.learner_certificates (learner_id, course_id, cpd_hours)
  values (v_uid, p_course, coalesce(v_cpd, 0))
  on conflict do nothing
  returning id into v_cert;

  if v_cert is not null then
    return v_cert;
  end if;

  select id into v_existing
  from public.learner_certificates
  where learner_id = v_uid and course_id = p_course and deleted_at is null
  limit 1;
  return v_existing;
end;
$$;

revoke execute on function public.issue_course_certificate(uuid) from anon;
grant execute on function public.issue_course_certificate(uuid) to authenticated;

-- ===========================================================================
-- 6. Coupons: redeem once per order, under the cap, atomically
-- ===========================================================================

-- The old redeem_coupon(text) incremented used_count from the browser at
-- checkout, and the confirmation path incremented it a second time with a
-- read-modify-write. Replace both with one order-scoped, idempotent function.
create or replace function public.redeem_coupon_for_order(p_order uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_code   text;
  v_buyer  uuid;
  v_coupon public.coupons%rowtype;
begin
  select coupon_code, buyer_id into v_code, v_buyer
  from public.orders where id = p_order;
  if v_code is null then
    return false;
  end if;

  -- Only the buyer or staff may redeem against this order.
  if not (v_buyer = auth.uid() or private.is_staff()) then
    return false;
  end if;

  -- Lock the coupon row so the cap check and the increment cannot interleave.
  select * into v_coupon from public.coupons
  where code = upper(trim(v_code)) for update;
  if not found or v_coupon.is_active is not true then
    return false;
  end if;
  if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
    return false;
  end if;
  if v_coupon.max_uses is not null
     and coalesce(v_coupon.used_count, 0) >= v_coupon.max_uses then
    return false;
  end if;

  -- Already redeemed for this order: succeed without counting it twice.
  insert into public.coupon_redemptions (coupon_id, order_id, redeemed_by)
  values (v_coupon.id, p_order, coalesce(v_buyer, auth.uid()))
  on conflict (coupon_id, order_id) do nothing;
  if not found then
    return true;
  end if;

  update public.coupons
  set used_count = coalesce(used_count, 0) + 1
  where id = v_coupon.id;
  return true;
end;
$$;

revoke execute on function public.redeem_coupon_for_order(uuid) from anon;
grant execute on function public.redeem_coupon_for_order(uuid) to authenticated;

-- The old entry point stays callable so an older cached bundle does not error,
-- but it is now a no-op: counting happens per order.
create or replace function public.redeem_coupon(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Intentionally does nothing. Superseded by redeem_coupon_for_order(uuid),
  -- which counts a coupon once per order instead of once per call.
  perform p_code;
end;
$$;

-- ===========================================================================
-- 7. Order confirmation: staff-only, idempotent, enrolment included
-- ===========================================================================

create or replace function public.confirm_order(p_order uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_order  public.orders%rowtype;
  v_course uuid;
begin
  if not private.is_staff() then
    raise exception 'Only staff may confirm an order'
      using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order for update;
  if not found then
    return false;
  end if;

  -- Idempotent: confirming an already-paid order changes nothing and must not
  -- re-count the coupon or re-enrol the buyer.
  if v_order.status = 'paid' then
    return false;
  end if;

  update public.orders
  set status = 'paid', paid_at = now(), confirmed_by = auth.uid()
  where id = p_order;

  -- Enrol the buyer on every course sold in this order. The unique index makes
  -- the insert safe to run concurrently.
  for v_course in
    select distinct pr.course_id
    from public.order_items oi
    join public.products pr on pr.id = oi.product_id
    where oi.order_id = p_order and pr.course_id is not null
  loop
    insert into public.enrollments (learner_id, course_id, status)
    values (v_order.buyer_id, v_course, 'not_started')
    on conflict do nothing;
  end loop;

  perform public.redeem_coupon_for_order(p_order);

  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'order.confirmed', 'order', p_order,
          jsonb_build_object('reference', v_order.reference));
  return true;
end;
$$;

revoke execute on function public.confirm_order(uuid) from anon;
grant execute on function public.confirm_order(uuid) to authenticated;

-- ===========================================================================
-- 8. Course withdrawal: archive by default, hard delete only when unused
-- ===========================================================================

-- What a course is entangled with, so the confirmation dialogue can tell the
-- administrator exactly what archiving will and will not touch.
create or replace function public.course_deletion_impact(p_course uuid)
returns table (
  enrolments   bigint,
  certificates bigint,
  assessments  bigint,
  orders       bigint,
  sessions     bigint,
  resources    bigint,
  can_hard_delete boolean
)
language sql
stable
security definer
set search_path = public, private
as $$
  with counts as (
    select
      (select count(*) from public.enrollments e
         where e.course_id = p_course and e.deleted_at is null) as enrolments,
      (select count(*) from public.learner_certificates c
         where c.course_id = p_course and c.deleted_at is null) as certificates,
      (select count(*) from public.assessments a
         where a.course_id = p_course and a.deleted_at is null) as assessments,
      (select count(*) from public.order_items oi
         join public.products pr on pr.id = oi.product_id
         where pr.course_id = p_course) as orders,
      (select count(*) from public.training_sessions s
         where s.course_id = p_course and s.deleted_at is null) as sessions,
      (select count(*) from public.course_resources r
         where r.course_id = p_course and r.deleted_at is null) as resources
  )
  select enrolments, certificates, assessments, orders, sessions, resources,
         (private.is_admin()
          and enrolments = 0 and certificates = 0 and orders = 0 and sessions = 0)
  from counts
  where private.is_staff();
$$;

revoke execute on function public.course_deletion_impact(uuid) from anon;
grant execute on function public.course_deletion_impact(uuid) to authenticated;

-- Archive: the safe default. The course leaves the catalogue and stops
-- accepting enrolments, but every certificate, result and invoice that refers
-- to it keeps its meaning. Regulated training records must not evaporate
-- because someone tidied the catalogue.
create or replace function public.archive_course(p_course uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_title text;
begin
  if not private.is_admin() then
    raise exception 'Only administrators may archive a course'
      using errcode = '42501';
  end if;

  select title into v_title from public.courses
  where id = p_course and deleted_at is null;
  if v_title is null then
    return false;
  end if;

  update public.courses
  set deleted_at = now(), is_published = false
  where id = p_course;

  -- Unpublish anything that would otherwise still be reachable.
  update public.assessments set is_published = false
  where course_id = p_course and deleted_at is null;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'course.archived', 'course', p_course,
          jsonb_build_object('title', v_title));
  return true;
end;
$$;

create or replace function public.restore_course(p_course uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.is_admin() then
    raise exception 'Only administrators may restore a course'
      using errcode = '42501';
  end if;
  update public.courses
  set deleted_at = null, is_published = false
  where id = p_course and deleted_at is not null;
  if not found then
    return false;
  end if;
  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'course.restored', 'course', p_course, '{}'::jsonb);
  return true;
end;
$$;

-- Permanent removal, allowed only for a course nobody has touched: no
-- enrolments, no certificates, no orders, no sessions. This is the escape hatch
-- for a course created by mistake, and it refuses anything else rather than
-- leaving orphaned learner records behind.
create or replace function public.delete_course_permanently(p_course uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_title text;
  v_impact record;
begin
  if not private.is_admin() then
    raise exception 'Only administrators may delete a course'
      using errcode = '42501';
  end if;

  select * into v_impact from public.course_deletion_impact(p_course);
  if v_impact is null or v_impact.can_hard_delete is not true then
    raise exception 'This course has learner records and cannot be deleted. Archive it instead.'
      using errcode = 'P0001';
  end if;

  select title into v_title from public.courses where id = p_course;

  delete from public.question_options
   where question_id in (
     select q.id from public.questions q
     join public.assessments a on a.id = q.assessment_id
     where a.course_id = p_course);
  delete from public.questions
   where assessment_id in (select id from public.assessments where course_id = p_course);
  delete from public.assessments where course_id = p_course;
  delete from public.lessons
   where module_id in (select id from public.modules where course_id = p_course);
  delete from public.modules where course_id = p_course;
  delete from public.course_resources where course_id = p_course;
  delete from public.courses where id = p_course;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'course.deleted', 'course', p_course,
          jsonb_build_object('title', v_title));
  return true;
end;
$$;

revoke execute on function public.archive_course(uuid) from anon;
revoke execute on function public.restore_course(uuid) from anon;
revoke execute on function public.delete_course_permanently(uuid) from anon;
grant execute on function public.archive_course(uuid) to authenticated;
grant execute on function public.restore_course(uuid) to authenticated;
grant execute on function public.delete_course_permanently(uuid) to authenticated;
```

---

## Step 3 — Migration 093: assessment guards and certificate expiry

Run this **after** step 2 has succeeded. It depends on the `private` schema
helpers that step 2 relies on being in place.

<details>
<summary><strong>What this changes, in plain terms</strong></summary>

- An assessment attempt now requires the learner to be enrolled on the course,
  and refuses once they have used their allowed attempts. Both rules existed
  only in the page before, so calling the API directly bypassed them: anyone
  could resit until they passed.
- Certificates get an expiry date taken from the course's renewal period, and
  existing certificates are backfilled. Until now nothing ever expired and the
  daily expiry reminder had nothing to find.
- Staff are allowed to sit an assessment to check it. A staff attempt is still
  recorded as an attempt, which is why the platform has a separate preview mode
  that records nothing.

</details>

```sql
-- 093_assessment_and_expiry_guards.sql
--
-- Deploy: supabase db push
--
-- Two gaps the automated journey test exposed.
--
-- 1. submit_assessment_attempt enforced neither enrolment nor the attempt cap.
--    The take-assessment page blocks a learner once max_attempts is reached,
--    but the page is not the control: anyone can call the RPC directly and keep
--    resitting until they pass, or sit an assessment for a course they were
--    never enrolled on. An assessment that can be retried without limit is not
--    an assessment.
--
-- 2. issue_course_certificate never set expires_at, so every certificate issued
--    by completing a course had no expiry at all. courses.renewal_months exists
--    and the daily expiry-alert job reads expires_at, so the whole renewal
--    chain silently did nothing: no reminder, no expiry, and a CSTF refresh
--    that nobody is told about.

-- ===========================================================================
-- 1. Assessment attempts: enrolled, and inside the cap
-- ===========================================================================

create or replace function public.submit_assessment_attempt(
  p_assessment uuid,
  p_answers jsonb,
  p_time_taken int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid         uuid := auth.uid();
  v_pass_mark   int;
  v_max         int;
  v_course      uuid;
  v_used        int;
  v_total       int := 0;
  v_earned      int := 0;
  v_has_essay   boolean := false;
  v_score       int;
  v_passed      boolean;
  v_attempt     uuid;
  q             record;
  v_correct     boolean;
  v_chosen      text[];
  v_correct_ids text[];
  v_given       text;
  v_response    text;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select pass_mark, max_attempts, course_id
    into v_pass_mark, v_max, v_course
  from public.assessments
  where id = p_assessment and is_published = true and deleted_at is null;
  if v_pass_mark is null then
    raise exception 'Assessment not found' using errcode = 'P0002';
  end if;

  -- Enrolment. A course-linked assessment belongs to the people taking that
  -- course; staff may sit one to check it, and a standalone assessment (no
  -- course) stays open. Staff attempts are still recorded as attempts, which
  -- is why the platform offers a preview mode that records nothing.
  if v_course is not null
     and not private.is_staff()
     and not exists (
       select 1 from public.enrollments
       where course_id = v_course and learner_id = v_uid and deleted_at is null
     ) then
    raise exception 'You are not enrolled on this course' using errcode = '42501';
  end if;

  -- Attempt cap. Zero and null both mean unlimited, matching the UI.
  if coalesce(v_max, 0) > 0 then
    select count(*) into v_used
    from public.assessment_attempts
    where assessment_id = p_assessment and learner_id = v_uid and deleted_at is null;
    if v_used >= v_max then
      raise exception 'You have used all % attempts for this assessment', v_max
        using errcode = '42501';
    end if;
  end if;

  insert into public.assessment_attempts
    (assessment_id, learner_id, score, passed, time_taken_secs, completed_at)
  values (p_assessment, v_uid, 0, false, p_time_taken, now())
  returning id into v_attempt;

  for q in
    select id, type, points
    from public.questions
    where assessment_id = p_assessment and deleted_at is null
  loop
    v_total := v_total + q.points;

    if q.type = 'free_text' then
      v_has_essay := true;
      v_response := coalesce(p_answers -> q.id::text ->> 'textResponse', '');
      insert into public.attempt_answers (attempt_id, question_id, response, is_correct)
      values (v_attempt, q.id, v_response, null);
      continue;
    end if;

    v_correct := false;

    if q.type in ('mcq', 'true_false') then
      select coalesce(array_agg(id::text order by id::text), '{}')
        into v_correct_ids
        from public.question_options
        where question_id = q.id and is_correct = true and deleted_at is null;

      select coalesce(array_agg(x order by x), '{}')
        into v_chosen
        from jsonb_array_elements_text(
          coalesce(p_answers -> q.id::text -> 'selectedOptionIds', '[]'::jsonb)
        ) as t(x);

      v_correct := array_length(v_correct_ids, 1) is not null
        and v_correct_ids = v_chosen;

      insert into public.attempt_answers (attempt_id, question_id, response, is_correct)
      values (v_attempt, q.id, array_to_string(v_chosen, ','), v_correct);
    else
      v_given := lower(trim(coalesce(p_answers -> q.id::text ->> 'textResponse', '')));
      v_correct := v_given <> '' and exists (
        select 1 from public.question_options
        where question_id = q.id
          and deleted_at is null
          and lower(trim(label)) = v_given
      );
      insert into public.attempt_answers (attempt_id, question_id, response, is_correct)
      values (v_attempt, q.id, v_given, v_correct);
    end if;

    if v_correct then
      v_earned := v_earned + q.points;
    end if;
  end loop;

  v_score := case when v_total > 0
    then round((v_earned::numeric / v_total) * 100)
    else 0 end;
  v_passed := v_score >= v_pass_mark;

  update public.assessment_attempts
  set score = v_score, passed = v_passed
  where id = v_attempt;

  return jsonb_build_object('score', v_score, 'passed', v_passed, 'autoGraded', not v_has_essay);
end;
$$;

revoke all on function public.submit_assessment_attempt(uuid, jsonb, int) from public;
grant execute on function public.submit_assessment_attempt(uuid, jsonb, int) to authenticated;

-- ===========================================================================
-- 2. Certificates expire when the course says they do
-- ===========================================================================

create or replace function public.issue_course_certificate(p_course uuid)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid      uuid := auth.uid();
  v_total    integer;
  v_done     integer;
  v_assess   uuid;
  v_passed   integer;
  v_existing uuid;
  v_cpd      numeric;
  v_renewal  integer;
  v_expires  timestamptz;
  v_cert     uuid;
begin
  if v_uid is null then
    return null;
  end if;

  if not exists (
    select 1 from public.enrollments
    where course_id = p_course and learner_id = v_uid and deleted_at is null
  ) then
    return null;
  end if;

  select count(*) into v_total
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where m.course_id = p_course
    and l.deleted_at is null
    and m.deleted_at is null;
  if v_total = 0 then
    return null;
  end if;

  select count(*) into v_done
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  join public.modules m on m.id = l.module_id
  where m.course_id = p_course
    and lp.learner_id = v_uid
    and lp.completed = true
    and l.deleted_at is null
    and m.deleted_at is null;
  if v_done < v_total then
    return null;
  end if;

  select id into v_assess
  from public.assessments
  where course_id = p_course and is_published = true and deleted_at is null
  limit 1;
  if v_assess is not null then
    select count(*) into v_passed
    from public.assessment_attempts
    where assessment_id = v_assess and learner_id = v_uid and passed = true;
    if v_passed = 0 then
      return null;
    end if;
  end if;

  select cpd_hours, renewal_months into v_cpd, v_renewal
  from public.courses where id = p_course;

  -- An expiry only exists if the course defines a renewal period. Without this
  -- the daily expiry-alert job had nothing to find, so nobody was ever told to
  -- refresh a certificate.
  v_expires := case
    when coalesce(v_renewal, 0) > 0 then now() + (v_renewal || ' months')::interval
    else null
  end;

  insert into public.learner_certificates (learner_id, course_id, cpd_hours, expires_at)
  values (v_uid, p_course, coalesce(v_cpd, 0), v_expires)
  on conflict do nothing
  returning id into v_cert;

  if v_cert is not null then
    return v_cert;
  end if;

  select id into v_existing
  from public.learner_certificates
  where learner_id = v_uid and course_id = p_course and deleted_at is null
  limit 1;
  return v_existing;
end;
$$;

revoke execute on function public.issue_course_certificate(uuid) from anon;
grant execute on function public.issue_course_certificate(uuid) to authenticated;

-- Existing certificates issued before this fix have no expiry. Give them one
-- where their course defines a renewal period, measured from issue, so the
-- renewal chain covers the records already in the register.
update public.learner_certificates lc
set expires_at = lc.issued_at + (c.renewal_months || ' months')::interval
from public.courses c
where c.id = lc.course_id
  and lc.expires_at is null
  and lc.deleted_at is null
  and coalesce(c.renewal_months, 0) > 0;
```

---

## Step 4 — Verify

Reads only. Every check below should come back the way the comment says.

```sql
-- 4a. The new helper functions exist.
--     Expected: 4 rows (current_organisation_id, default_organisation_id,
--     same_org, staff_for).
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'private'
  and p.proname in ('default_organisation_id', 'current_organisation_id',
                    'same_org', 'staff_for')
order by p.proname;

-- 4b. The new public functions exist.
--     Expected: 6 rows (archive_course, confirm_order,
--     course_deletion_impact, delete_course_permanently,
--     redeem_coupon_for_order, restore_course).
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('archive_course', 'restore_course',
                    'delete_course_permanently', 'course_deletion_impact',
                    'confirm_order', 'redeem_coupon_for_order')
order by p.proname;

-- 4c. The unique indexes exist.
--     Expected: 2 rows.
select indexname
from pg_indexes
where schemaname = 'public'
  and indexname in ('lc_learner_course_uidx', 'enrollments_learner_course_uidx')
order by indexname;

-- 4d. Every profile now belongs to an organisation.
--     Expected: 0. It was 4 before the run.
select count(*) as profiles_without_organisation
from public.profiles
where organisation_id is null;

-- 4d-ii. The profile guard now admits a caller with no session, which is what
--        let the backfill run and what unblocks bulk learner import.
--        Expected: 1 row, containing "auth.uid() is null".
select 'guard allows session-less callers' as check,
       position('auth.uid() is null' in pg_get_functiondef(p.oid)) > 0 as fixed
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'guard_profile_privileged_cols';

-- 4e. No policy declared FOR ALL is left on the learner-personal tables.
--     A FOR ALL policy grants SELECT as well, which would undo the scoping.
--     Expected: 0 rows.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and cmd = 'ALL'
  and tablename in ('learner_certificates', 'enrollments', 'lesson_progress',
                    'assessment_attempts', 'attempt_answers',
                    'attendance_records', 'session_bookings', 'profiles');

-- 4f. Nothing was lost. Compare against the numbers from step 1b.
select 'profiles'              as table_name, count(*) from public.profiles
union all select 'organisations',            count(*) from public.organisations
union all select 'courses',                  count(*) from public.courses
union all select 'enrollments',              count(*) from public.enrollments
union all select 'assessment_attempts',      count(*) from public.assessment_attempts
union all select 'learner_certificates',     count(*) from public.learner_certificates
union all select 'orders',                   count(*) from public.orders
union all select 'coupons',                  count(*) from public.coupons;

-- 4g. The coupon redemption ledger exists and is empty, which is correct:
--     no coupon has ever actually been redeemed.
--     Expected: 0.
select count(*) as recorded_redemptions from public.coupon_redemptions;

-- 4h. Certificate expiry after the backfill.
--     Every row will still show expires_at as null until step 5, because no
--     course has a renewal period set yet. That is expected, not a failure.
select lc.certificate_number,
       c.title            as course,
       c.renewal_months,
       lc.expires_at
from public.learner_certificates lc
left join public.courses c on c.id = lc.course_id
where lc.deleted_at is null
order by lc.certificate_number;
```

---

## Step 4b — Record that these were applied

Running SQL by hand in the editor does **not** tell the migration system that
these files have run. Without this step a future `supabase db push` will try to
apply them again. They are idempotent so it would be harmless, but it is
confusing, and it makes `supabase migration list` lie about the state of the
database.

Run this once, after step 4 has come back clean:

```sql
insert into supabase_migrations.schema_migrations (version, name, statements)
values
  ('092', 'authorisation_and_integrity', array[]::text[]),
  ('093', 'assessment_and_expiry_guards', array[]::text[])
on conflict (version) do nothing;

-- Confirm. Expected: 093 at the top, then 092, then 091.
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 4;
```

If that insert fails because the table has a different shape on this project,
skip it and tell me. It is bookkeeping, not function: the database is already
correct at this point.

## Step 5 — The one decision only you can make

**No course has a renewal period set.** Steps 2 and 3 made the platform
*capable* of expiring certificates and sending renewal reminders. It will not do
either until each course says how long its certificate lasts.

`renewal_months` means: a certificate for this course is valid for this many
months from the day it is issued. Leaving it `null` means the certificate never
expires, which is the right answer for some courses and the wrong answer for
most statutory ones.

### Nothing already issued is at risk

Worth knowing before you decide. Only one certificate on the system has no
expiry date, and it belongs to the automated test fixture, which is not
CSTF-aligned and gets no renewal period below. The two real certificates already
carry an expiry, and the backfill only fills blanks. **Setting the periods below
changes no existing certificate and sends no reminder to anybody.**

Confirm that for yourself before running anything:

```sql
select lc.certificate_number,
       c.title as course,
       c.is_cstf_aligned,
       lc.issued_at,
       lc.expires_at
from public.learner_certificates lc
left join public.courses c on c.id = lc.course_id
where lc.expires_at is null
  and lc.deleted_at is null;
```

**Expected:** one row, `QA automated journey (do not publish)`. If anything else
appears, read the "before you backfill" check further down before proceeding.

### Proposed periods, for clinical sign-off

The periods below follow the Core Skills Training Framework's own refresh
intervals: the practical and clinical subjects that decay are annual, and the
knowledge-based subjects are three-yearly. This is a **proposal, not a fact**.
Renewal intervals vary by employer and by commissioner, and this is Harni's call
as Clinical Director, not mine. Change any number before you run it.

```sql
-- ---------------------------------------------------------------------------
-- 5a. CSTF: annual refresh (12 months)
--     Practical and clinical competence that decays without practice.
-- ---------------------------------------------------------------------------
update public.courses set renewal_months = 12 where id in (
  '7388688e-45c5-4d4f-bd14-a8d81aa93d22',  -- Basic Life Support
  '04fe5c3e-875f-49c0-8cd9-59083e44bd6d',  -- Basic Life Support (BLS) Essentials
  '8675f85c-2b72-4788-87f9-6962b0c19cf6',  -- Basic Life Support and AED
  '9acdc04f-a24f-4511-a99a-3db1806dc750',  -- Basic Life Support and First Aid
  'cddc5b28-36e6-4cec-ba7b-e157b09ab511',  -- Fire Safety Awareness
  '4d9f2f9c-eb28-4547-821b-88c87db8f411',  -- Infection Prevention and Control
  '4eb7cb1d-1d34-441b-a15e-6461cc01012d',  -- Information Governance and Data Security
  '3c3df748-ef16-470b-ac63-b2f4d199aa2e',  -- Medication Administration
  '8babc039-6396-427a-8881-a614efd0cacf',  -- Moving and Handling of People
  '30a4514b-bf0c-4c60-b2fb-5271da2866ac',  -- Moving and Handling People
  'b88fefdd-57fb-458d-9949-99810749c0f9',  -- Safe Administration of Medication
  'a417594b-3a6b-409e-a1ce-16f5d179a180'   -- Safeguarding Children Level 3
);

-- ---------------------------------------------------------------------------
-- 5b. CSTF: three-yearly refresh (36 months)
--     Knowledge and legislation, where the content changes slowly.
-- ---------------------------------------------------------------------------
update public.courses set renewal_months = 36 where id in (
  'b367a3d5-cda2-4f27-a5be-a3f6b263460d',  -- Equality and Diversity
  'cbfb39d5-4a70-4e45-a7b0-971fe7408f1b',  -- Equality, Diversity and Inclusion
  '6ec9675c-9f8b-47f0-b4e3-929baf52ef2e',  -- Health, Safety and Welfare
  '7b2795e0-91ff-40f2-b996-744c3c1d23cc',  -- Mental Capacity Act and DoLS
  '31644ca4-98f9-46a3-8cb7-ebecfd8447a0',  -- Prevent Awareness
  '7db8cf0d-0d7e-412e-9ff2-663e41cb9de8',  -- Safeguarding Adults Level 1
  '7b0c52c0-916e-4481-aa14-deb9283c9185',  -- Safeguarding Adults Level 2
  'bdc5e177-ab9f-4185-9f2b-0cdf27ed3be6',  -- Safeguarding Children Level 1
  '9fa43137-a253-4d06-9d5a-0a10b6651a3a'   -- Safeguarding Children Level 2
);

-- ---------------------------------------------------------------------------
-- 5c. Statutory certificates outside CSTF, where the awarding body sets the
--     validity period rather than you. First aid and food safety are the
--     obvious ones: a first aid at work certificate is a three-year
--     certificate by regulation.
-- ---------------------------------------------------------------------------
update public.courses set renewal_months = 36 where id in (
  '0d0c9c32-a146-4f87-93e5-0b46899e4ff9',  -- First Aid at Work
  'a8352d56-6bea-4375-9d59-86faf7c97e73',  -- Emergency First Aid at Work
  '759d95bf-d1fc-4bfe-b665-df7bb1f79717',  -- Paediatric First Aid
  '648d7c94-da82-4f93-aea2-9df2f3eeccbf',  -- Mental Health First Aid
  '6842b2e5-cb9d-45a4-b66a-324117519689',  -- Food Safety and Hygiene Level 1
  'fae07c68-af64-420b-8184-555225fb1b2d'   -- Food Safety and Hygiene Level 2
);

update public.courses set renewal_months = 12 where id in (
  'd5e9e938-be2c-45a4-8368-16a9ac4e93bc'   -- Fire Warden / Marshal
);
```

### Deliberately left with no expiry

**Care Certificate** (`ad864248-…`) is CSTF-aligned but is an induction standard,
achieved once. It is not usually re-taken, so it keeps no renewal period. Set one
if your commissioners expect it:

```sql
-- Only if the Care Certificate should expire in your organisation.
-- update public.courses set renewal_months = 36
-- where id = 'ad864248-c896-4996-b273-d41401ff5107';
```

Everything else — the Train the Trainer courses, the specialist clinical skills
(catheterisation, venepuncture, tracheostomy care), the soft skills — is left
with no expiry, because the right interval there is your organisation's
competency policy rather than a published standard. Set any of them the same
way, by id.

### Check what you have set

```sql
select renewal_months,
       count(*) as courses,
       string_agg(title, ', ' order by title) as which
from public.courses
where deleted_at is null and renewal_months is not null
group by renewal_months
order by renewal_months;
```

### What was actually applied, 24 August 2026

Step 5 has been run. **29 courses** now carry a renewal period: 14 at 12 months
and 15 at 36 months, matching 5a, 5b and 5c above.

Two notes on what that left behind.

**The Care Certificate is set to 12 months.** An earlier pass set 12 months
across every CSTF-aligned course, which caught it. The proposal above
deliberately leaves it with no expiry, because it is an induction standard
achieved once rather than a qualification that lapses. It was left as you set
it rather than silently reversed. Decide which you want:

```sql
-- Keep it as an induction standard that does not expire.
-- update public.courses set renewal_months = null
-- where id = 'ad864248-c896-4996-b273-d41401ff5107';
```

**No existing certificate changed.** The only one without an expiry belongs to
the automated test fixture, whose course has no renewal period, so the backfill
below is a confirmed no-op and nobody was emailed. The two real certificates
already carried expiry dates, and both happen to agree with their course's new
12-month period exactly.

### Backfill the certificates already issued

Setting a renewal period only affects **certificates issued from that point on**.
Run this to give an expiry to the ones already issued, measured from their
original issue date:

```sql
update public.learner_certificates lc
set expires_at = lc.issued_at + (c.renewal_months || ' months')::interval
from public.courses c
where c.id = lc.course_id
  and lc.expires_at is null
  and lc.deleted_at is null
  and coalesce(c.renewal_months, 0) > 0;
```

**Before you run it**, know what it does: a certificate issued longer ago than
its renewal period becomes *expired* the moment this runs, and the daily
reminder job emails its owner the next morning. On this database that affects
nothing, but check anyway, and check again on any future run:

```sql
select lc.certificate_number,
       c.title,
       lc.issued_at,
       lc.issued_at + (c.renewal_months || ' months')::interval as would_expire_at,
       (lc.issued_at + (c.renewal_months || ' months')::interval) < now()
         as would_be_expired_immediately
from public.learner_certificates lc
join public.courses c on c.id = lc.course_id
where lc.expires_at is null
  and lc.deleted_at is null
  and coalesce(c.renewal_months, 0) > 0;
```

**Expected right now:** no rows, because the only certificate without an expiry
belongs to a course with no renewal period.

---

## Step 6 — If something goes wrong

**A statement fails partway through step 2 or 3.** Nothing is half-applied in a
damaging way: each script is idempotent, so fix the reported problem and run
the whole script again. Send me the error text.

**Step 1d found duplicates.** Do not run step 2. The unique index creation will
fail. Send me the rows and I will write a de-duplication script that keeps the
right one.

**Staff report they cannot see learners any more.** That would mean the staff
account's `organisation_id` does not match the learners'. Check with:

```sql
select p.email, p.role, o.name as organisation
from public.profiles p
left join public.organisations o on o.id = p.organisation_id
order by p.role, p.email;
```

Everyone should be in the same organisation. If a staff account has none:

```sql
update public.profiles
set organisation_id = (select id from public.organisations
                       where deleted_at is null
                       order by created_at limit 1)
where organisation_id is null;
```

**You want to undo the organisation scoping entirely.** This puts the read
policies back to the pre-092 behaviour, where any staff member sees every
learner. It leaves the unique indexes and the new functions in place, which are
the parts you want to keep regardless.

```sql
-- Emergency revert of organisation scoping ONLY. Use if scoping locks staff out.
drop policy if exists certs_select on public.learner_certificates;
create policy certs_select on public.learner_certificates for select
  using (learner_id = (select auth.uid()) or private.is_staff());

drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select
  using (learner_id = (select auth.uid()) or private.is_staff());

drop policy if exists lesson_progress_select on public.lesson_progress;
create policy lesson_progress_select on public.lesson_progress for select
  using (learner_id = (select auth.uid()) or private.is_staff());

drop policy if exists attempts_select on public.assessment_attempts;
create policy attempts_select on public.assessment_attempts for select
  using (learner_id = (select auth.uid()) or private.is_staff());

drop policy if exists attendance_select on public.attendance_records;
create policy attendance_select on public.attendance_records for select
  using (learner_id = (select auth.uid()) or private.is_staff());

drop policy if exists bookings_select on public.session_bookings;
create policy bookings_select on public.session_bookings for select
  using (learner_id = (select auth.uid()) or private.is_staff());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = (select auth.uid()) or private.is_staff());
```

---

## Step 7 — Tell me when it is done

Once step 4 comes back clean, say so. I will then:

1. Re-run the authorisation suite with `MIGRATION_092_APPLIED=1` and
   `MIGRATION_093_APPLIED=1`, which turns on the organisation-scoping
   assertions, the attempt-cap and enrolment guards, and the concurrency tests.
   All of those are skipped today, and a skipped test is not a passing one.
2. Set the same two repository variables so CI runs them on every push.
3. Report what the newly enabled tests found.

### One thing this runbook cannot fix

**Registration is still broken**, and no SQL will mend it. Signing up returns
`Error sending confirmation email` and creates no account, because Supabase Auth
cannot send mail on this project. That is fixed in
**Dashboard → Project Settings → Authentication → SMTP Settings**, by
configuring a custom SMTP provider. Until then nobody can create an account and
nobody can reset a password.
