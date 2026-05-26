-- Add ticket-related fields to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS ticket_name text DEFAULT 'General Admission',
ADD COLUMN IF NOT EXISTS booking_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS available_tickets integer,
ADD COLUMN IF NOT EXISTS total_tickets integer,
ADD COLUMN IF NOT EXISTS ticket_description text DEFAULT 'Access to all event activities and materials';