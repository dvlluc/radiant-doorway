-- Add benefits column to events table
ALTER TABLE public.events
ADD COLUMN benefits text[] DEFAULT '{}';

COMMENT ON COLUMN public.events.benefits IS 'List of event benefits displayed to attendees';