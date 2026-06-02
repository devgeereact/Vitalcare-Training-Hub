-- 031_payroll.sql
-- Staff payroll records (payslips). Records-only: amounts, periods and status.
-- Actual bank payment is handled outside the app; "paid" simply marks the
-- payslip as settled. Staff see their own payslips; admins manage all.

create table if not exists public.payroll (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  staff_name text not null,
  staff_email text,
  period text not null,
  period_start date,
  period_end date,
  gross_pence integer not null default 0,
  deductions_pence integer not null default 0,
  net_pence integer not null default 0,
  notes text,
  status text not null default 'draft' check (status in ('draft','approved','paid')),
  issued_by uuid references public.profiles(id),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payroll enable row level security;

drop policy if exists payroll_select on public.payroll;
create policy payroll_select on public.payroll
  for select using (staff_id = auth.uid() or public.is_admin());

drop policy if exists payroll_insert on public.payroll;
create policy payroll_insert on public.payroll
  for insert with check (public.is_admin());

drop policy if exists payroll_update on public.payroll;
create policy payroll_update on public.payroll
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists payroll_delete on public.payroll;
create policy payroll_delete on public.payroll
  for delete using (public.is_admin());

create index if not exists payroll_staff_idx on public.payroll(staff_id);
