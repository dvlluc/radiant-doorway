
-- Add sponsors field to events table
ALTER TABLE public.events 
ADD COLUMN sponsors jsonb DEFAULT NULL;

COMMENT ON COLUMN public.events.sponsors IS 'Array of sponsor objects with logo and website';
