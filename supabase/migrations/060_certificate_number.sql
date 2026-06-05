-- 060_certificate_number.sql
-- Adds a human-readable certificate number to learner_certificates.
-- Format: VC-CERT-<YYYY>-<4-digit sequence>, generated on insert.
-- Existing rows are backfilled in issue order; the sequence is then advanced
-- past the backfilled count so new inserts never collide.

alter table public.learner_certificates
  add column if not exists certificate_number text;

create sequence if not exists public.certificate_number_seq;

-- Generates the next certificate number, used as the column default.
create or replace function public.next_certificate_number()
returns text
language sql
volatile
as $$
  select 'VC-CERT-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.certificate_number_seq')::text, 4, '0')
$$;

-- Backfill existing certificates that have no number yet.
with ordered as (
  select id,
         to_char(issued_at, 'YYYY') as yr,
         row_number() over (order by issued_at, created_at) as rn
  from public.learner_certificates
  where certificate_number is null
)
update public.learner_certificates lc
set certificate_number = 'VC-CERT-' || o.yr || '-' || lpad(o.rn::text, 4, '0')
from ordered o
where o.id = lc.id;

-- Advance the sequence past the backfilled rows.
select setval(
  'public.certificate_number_seq',
  greatest((select count(*) from public.learner_certificates), 0) + 1,
  false
);

alter table public.learner_certificates
  alter column certificate_number set default public.next_certificate_number();

create unique index if not exists learner_certificates_number_key
  on public.learner_certificates (certificate_number);
