-- Add end_time field to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS end_time text;