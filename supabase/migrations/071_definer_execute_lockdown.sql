-- 071_definer_execute_lockdown.sql
-- Security Advisor: SECURITY DEFINER functions were callable by anon because
-- Postgres default-grants EXECUTE to PUBLIC (which includes anon), so revoking
-- only from anon left the default in place. Revoke from PUBLIC and grant only
-- authenticated on the functions that require a signed-in user.
--
-- Deliberately NOT touched (they must stay anon-callable, return only
-- non-sensitive data): verify_certificate (public cert check),
-- increment_blog_views (public view counter), get_public_config (public
-- Turnstile site key for pre-auth pages).

revoke execute on function public.course_enrolment_counts() from public, anon;
grant execute on function public.course_enrolment_counts() to authenticated;

revoke execute on function public.get_question_options(uuid) from public, anon;
grant execute on function public.get_question_options(uuid) to authenticated;

revoke execute on function public.issue_course_certificate(uuid) from public, anon;
grant execute on function public.issue_course_certificate(uuid) to authenticated;

revoke execute on function public.redeem_coupon(text) from public, anon;
grant execute on function public.redeem_coupon(text) to authenticated;

revoke execute on function public.submit_assessment_attempt(uuid, jsonb, integer) from public, anon;
grant execute on function public.submit_assessment_attempt(uuid, jsonb, integer) to authenticated;
