-- Security sweep follow-ups.
-- Deploy: supabase db push

-- 1. Certificates: staff may issue (insert), but only admins may approve or
--    change them. The previous certs_write = is_staff() let a trainer set
--    approved = true or forge a code by direct UPDATE, bypassing the admin
--    approval RPC. Split the blanket policy.
drop policy if exists certs_write on public.learner_certificates;

drop policy if exists certs_insert on public.learner_certificates;
create policy certs_insert on public.learner_certificates for insert
  with check (private.is_staff());

drop policy if exists certs_update on public.learner_certificates;
create policy certs_update on public.learner_certificates for update
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists certs_delete on public.learner_certificates;
create policy certs_delete on public.learner_certificates for delete
  using (private.is_admin());

-- 2. Virtual join requests: let a learner re-raise their own request (for
--    example after a decline) by resetting it to pending, but never let them
--    approve themselves. Admin approval policy (sjr_update) stays.
drop policy if exists sjr_learner_update on public.session_join_requests;
create policy sjr_learner_update on public.session_join_requests for update
  using (learner_id = auth.uid())
  with check (learner_id = auth.uid() and status = 'pending');

-- 3. Lock down EXECUTE on the VC-code helpers (Postgres grants to PUBLIC by
--    default), matching the rest of the codebase.
revoke execute on function public.gen_vc_code() from public;
revoke execute on function public.set_verification_code() from public;
