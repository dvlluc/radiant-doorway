-- Add contact preference field to events table
ALTER TABLE public.events 
ADD COLUMN contact_preference text DEFAULT 'email' CHECK (contact_preference IN ('email', 'messaging'));