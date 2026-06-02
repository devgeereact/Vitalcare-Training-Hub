-- Learners may mark their own attendance for sessions they are booked on.
drop policy if exists attendance_insert_own on public.attendance_records;
create policy attendance_insert_own on public.attendance_records for insert
  with check (
    public.is_staff()
    or (
      learner_id = auth.uid()
      and exists (
        select 1 from public.session_bookings b
        where b.session_id = attendance_records.session_id
          and b.learner_id = auth.uid()
      )
    )
  );

drop policy if exists attendance_update_own on public.attendance_records;
create policy attendance_update_own on public.attendance_records for update
  using (public.is_staff() or learner_id = auth.uid())
  with check (public.is_staff() or learner_id = auth.uid());

create unique index if not exists attendance_unique_pair
  on public.attendance_records (session_id, learner_id);
