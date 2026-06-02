-- 046_notifications_realtime.sql
-- Surface new-email and other new-event notifications in near-real-time.
--
-- The NotificationDropdown subscribes to INSERTs on public.notifications via
-- Supabase Realtime. The table was not yet in the supabase_realtime
-- publication, so live inserts were never broadcast and the dropdown only
-- updated on its 60s poll. Adding the table to the publication lets the client
-- receive each new notification immediately (RLS still gates rows to the owner).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$$;

-- Realtime row-change payloads carry the full new row; the existing
-- per-user RLS SELECT policy on notifications continues to restrict delivery
-- to the owning user, so no row is broadcast to anyone else.
