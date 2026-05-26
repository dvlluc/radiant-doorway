-- Add ticketing model fields to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS ticketing_model text DEFAULT 'commission' CHECK (ticketing_model IN ('subscription', 'commission')),
ADD COLUMN IF NOT EXISTS external_ticket_url text,
ADD COLUMN IF NOT EXISTS subscription_fee numeric DEFAULT 100;