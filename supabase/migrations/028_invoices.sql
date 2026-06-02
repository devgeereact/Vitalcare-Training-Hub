create table if not exists public.invoices (
  id            uuid primary key default gen_random_uuid(),
  number        text not null,
  recipient_id  uuid references public.profiles (id) on delete set null,
  recipient_name text,
  recipient_email text,
  items         jsonb not null default '[]'::jsonb,
  total_pence   integer not null default 0,
  status        text not null default 'draft'
                check (status in ('draft','sent','paid','void')),
  due_date      date,
  notes         text,
  issued_by     uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  paid_at       timestamptz
);
create index if not exists invoices_recipient_idx on public.invoices (recipient_id);

alter table public.invoices enable row level security;
drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select
  using (recipient_id = auth.uid() or public.is_staff());
drop policy if exists invoices_write on public.invoices;
create policy invoices_write on public.invoices for all
  using (public.is_staff()) with check (public.is_staff());
