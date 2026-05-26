-- Enable RLS on ticket_purchases if not already enabled
ALTER TABLE public.ticket_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to start fresh
DROP POLICY IF EXISTS "Users can view their own ticket purchases" ON public.ticket_purchases;
DROP POLICY IF EXISTS "Users can create their own ticket purchases" ON public.ticket_purchases;
DROP POLICY IF EXISTS "Event organizers can view purchases for their events" ON public.ticket_purchases;

-- Allow users to view their own ticket purchases
CREATE POLICY "Users can view their own ticket purchases"
ON public.ticket_purchases
FOR SELECT
TO authenticated
USING (purchaser_id = auth.uid());

-- Allow users to create their own ticket purchases
CREATE POLICY "Users can create their own ticket purchases"
ON public.ticket_purchases
FOR INSERT
TO authenticated
WITH CHECK (purchaser_id = auth.uid());

-- Allow event organizers to view all purchases for their events
CREATE POLICY "Event organizers can view purchases for their events"
ON public.ticket_purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = ticket_purchases.event_id
    AND events.user_id = auth.uid()
  )
);