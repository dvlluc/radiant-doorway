-- Add currency column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS currency_symbol text DEFAULT '$';