-- Add activities column to events table
ALTER TABLE public.events 
ADD COLUMN activities text;

-- Add refund_policy column to events table
ALTER TABLE public.events 
ADD COLUMN refund_policy text;