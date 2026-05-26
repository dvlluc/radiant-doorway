-- Add status column to ticket_purchases table
ALTER TABLE ticket_purchases
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

-- Add a check constraint for valid status values
ALTER TABLE ticket_purchases
ADD CONSTRAINT ticket_purchases_status_check
CHECK (status IN ('completed', 'pending', 'cancelled', 'removed'));