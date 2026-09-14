-- 095_certificate_verification_states.sql
--
-- Deploy: supabase db push
--
-- Public certificate verification told the truth in only two of the three
-- cases it can meet.
--
-- `is_valid` was false both for a certificate that had expired and for one
-- that had never been approved, and the page rendered every false the same
-- way: "Certificate expired. Genuine, but no longer in date." So a certificate
-- still waiting for the clinical director's approval was publicly reported as
-- genuine, and the learner's name was published with it. That is a claim the
-- company has not made, attached to a person who has not yet earned it.
--
-- The function now names the state, and returns no personal detail at all for
-- a certificate that has not been issued.

drop function if exists public.verify_certificate(text);

create function public.verify_certificate(p_code text)
returns table (
  learner_name      text,
  course_title      text,
  cpd_hours         numeric,
  issued_at         timestamptz,
  expires_at        timestamptz,
  verification_code text,
  is_valid          boolean,
  state             text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    -- Nothing personal leaves the server for a certificate that was never
    -- issued. A verifier learns that the code does not identify a valid
    -- certificate, which is all they are entitled to know.
    case when lc.approved then p.full_name end,
    case when lc.approved then c.title end,
    case when lc.approved then lc.cpd_hours end,
    case when lc.approved then lc.issued_at end,
    case when lc.approved then lc.expires_at end,
    lc.verification_code,
    (lc.approved and (lc.expires_at is null or lc.expires_at > now())),
    case
      when not lc.approved then 'not_issued'
      when lc.expires_at is not null and lc.expires_at <= now() then 'expired'
      else 'valid'
    end
  from public.learner_certificates lc
  join public.profiles p on p.id = lc.learner_id
  left join public.courses c on c.id = lc.course_id
  where (
      upper(lc.verification_code) = upper(trim(p_code))
      or lc.verification_uuid::text = lower(trim(p_code))
    )
    -- A withdrawn certificate returns no row at all, which the page shows as
    -- "no matching certificate". A revoked certificate must not read as one
    -- that merely lapsed.
    and lc.deleted_at is null;
$$;

revoke execute on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
