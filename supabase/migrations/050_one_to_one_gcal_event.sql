-- 050: Google Calendar event id for 1:1 requests.
-- When a 1:1 is approved and the Google integration is connected, the approval
-- creates a Google Calendar event with a Google Meet link. We keep the event id
-- so the event can be updated or removed later. Nullable: 1:1s fall back to a
-- Jitsi room when Google is not connected, in which case this stays NULL.

ALTER TABLE public.one_to_one_requests
  ADD COLUMN IF NOT EXISTS gcal_event_id text;

COMMENT ON COLUMN public.one_to_one_requests.gcal_event_id IS
  'Google Calendar event id when the approved 1:1 was synced to Google Calendar (Meet link). NULL when using the Jitsi fallback.';
