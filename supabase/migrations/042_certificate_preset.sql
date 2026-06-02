-- ============================================================================
-- Vitalcare Training Hub — Certificate template visual preset
-- Phase: Certificates (Module 09)
--
-- Adds a `preset` column to certificate_templates so the designer can choose
-- between three branded layouts:
--   'completion'    — top navy band + gold wavy divider + gold rosette
--   'participation' — navy corner waves + hex accents + star rosette (centred)
--   'achievement'   — navy + gold ornate double border + gold lower band
--
-- Defaults to 'completion'. Idempotent.
-- ============================================================================

alter table public.certificate_templates
  add column if not exists preset text not null default 'completion';

-- Constrain to the three known presets. Drop-then-add keeps it idempotent.
alter table public.certificate_templates
  drop constraint if exists certificate_templates_preset_chk;
alter table public.certificate_templates
  add constraint certificate_templates_preset_chk
  check (preset in ('completion', 'participation', 'achievement'));
