-- Human-friendly certificate verification codes. The certificate previously used
-- its raw UUID (verification_uuid) as the code, which is long and did not match
-- the short VC code printed on the certificate face. Introduce a stored, unique
-- VC-XXXXXX code (six characters, unambiguous alphabet), so the code printed on
-- the certificate is exactly the code the verifier checks.
-- Deploy: supabase db push

alter table public.learner_certificates
  add column if not exists verification_code text;

-- 'VC-' followed by six characters from an unambiguous alphabet (no 0/O/1/I).
create or replace function public.gen_vc_code()
returns text
language sql
volatile
as $$
  select 'VC-' || string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random() * 32)::int + 1), 1),
    ''
  )
  from generate_series(1, 6);
$$;

-- Backfill existing certificates with a unique code.
do $$
declare
  r record;
  v_code text;
begin
  for r in select id from public.learner_certificates where verification_code is null loop
    loop
      v_code := public.gen_vc_code();
      exit when not exists (
        select 1 from public.learner_certificates where verification_code = v_code
      );
    end loop;
    update public.learner_certificates set verification_code = v_code where id = r.id;
  end loop;
end $$;

create unique index if not exists lc_verification_code_idx
  on public.learner_certificates (verification_code);

-- Assign a unique code automatically on insert (the issue function inserts
-- without one, so the trigger fills it).
create or replace function public.set_verification_code()
returns trigger
language plpgsql
as $$
begin
  if new.verification_code is null then
    loop
      new.verification_code := public.gen_vc_code();
      exit when not exists (
        select 1 from public.learner_certificates where verification_code = new.verification_code
      );
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_verification_code on public.learner_certificates;
create trigger trg_set_verification_code
  before insert on public.learner_certificates
  for each row execute function public.set_verification_code();

-- Verify by the VC code (text). Falls back to the legacy UUID so older codes and
-- QR links keep working. Returns the code so the page can display it.
create or replace function public.verify_certificate(p_code text)
returns table (
  learner_name      text,
  course_title      text,
  cpd_hours         numeric,
  issued_at         timestamptz,
  expires_at        timestamptz,
  verification_code text,
  is_valid          boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.full_name,
    c.title,
    lc.cpd_hours,
    lc.issued_at,
    lc.expires_at,
    lc.verification_code,
    (lc.deleted_at is null and (lc.expires_at is null or lc.expires_at > now()))
  from public.learner_certificates lc
  join public.profiles p on p.id = lc.learner_id
  left join public.courses c on c.id = lc.course_id
  where (
      upper(lc.verification_code) = upper(trim(p_code))
      or lc.verification_uuid::text = lower(trim(p_code))
    )
    and lc.deleted_at is null;
$$;

revoke execute on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
