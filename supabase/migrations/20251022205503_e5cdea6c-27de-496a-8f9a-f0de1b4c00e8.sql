-- Add refund tracking columns to ticket_purchases table
ALTER TABLE ticket_purchases
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS refund_id text;

-- Update status constraint to include refunded
ALTER TABLE ticket_purchases
DROP CONSTRAINT IF EXISTS ticket_purchases_status_check;

ALTER TABLE ticket_purchases
ADD CONSTRAINT ticket_purchases_status_check
CHECK (status IN ('completed', 'pending', 'cancelled', 'removed', 'refunded'));