-- Make ticket_type_id nullable since not all events have specific ticket types
ALTER TABLE public.ticket_purchases 
ALTER COLUMN ticket_type_id DROP NOT NULL;