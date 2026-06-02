-- ============================================================================
-- Vitalcare Training Hub — Integration settings (Phase 11)
-- Self-serve API keys / secrets for linked services. SECURITY: no client RLS
-- policies, so the table is invisible to the browser. Only the service role
-- (Edge Functions) reads it; the `integrations` Edge Function writes it after
-- checking the caller is super_admin.
-- ============================================================================

create table if not exists public.integration_settings (
  name        text primary key,
  value       text not null,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.integration_settings enable row level security;
-- Deliberately NO policies: clients (anon / authenticated) get zero rows.
-- service_role bypasses RLS for Edge Function reads/writes.
