-- Add buffer_time column to services table for padding between appointments
ALTER TABLE public.services 
ADD COLUMN buffer_time integer DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.services.buffer_time IS 'Buffer time in minutes for setup/cleanup between appointments';