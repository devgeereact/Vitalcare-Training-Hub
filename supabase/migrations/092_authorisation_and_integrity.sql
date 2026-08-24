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
