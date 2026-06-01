-- 004_roles_expand.sql
-- Extend user_role enum from 4 to 6 roles + guest.
-- Roles: super_admin · admin · manager · trainer · content_editor · learner · guest
--
-- Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction block on
-- PostgreSQL < 12 and cannot be undone. Supabase runs PG15+, where
-- IF NOT EXISTS is supported and each statement auto-commits. Run these
-- one at a time in the Supabase SQL editor if your client wraps them in a txn.

alter type user_role add value if not exists 'manager';
alter type user_role add value if not exists 'content_editor';
alter type user_role add value if not exists 'guest';

-- RLS policy refinement for the new roles is deferred until their features
-- land (see docs/FEATURES.md). Existing policies treat unknown roles as
-- least-privilege, so adding the values is safe in the interim:
--   - manager        -> intended: team/cohort oversight (admin-scoped subset)
--   - content_editor -> intended: course/content authoring (no user admin)
--   - guest          -> intended: public/no-auth browsing only
