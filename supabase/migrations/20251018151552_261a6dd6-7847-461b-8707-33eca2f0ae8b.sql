-- Create ticket_purchases table to store individual ticket purchases
CREATE TABLE IF NOT EXISTS public.ticket_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_type_id uuid NOT NULL REFERENCES public.event_tickets(id) ON DELETE CASCADE,
  purchaser_id uuid NOT NULL,
  purchaser_name text NOT NULL,
  purchaser_email text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total_amount numeric NOT NULL,
  qr_code text NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamp with time zone,
  purchase_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_purchases ENABLE ROW LEVEL SECURITY;

-- Purchasers can view their own tickets
CREATE POLICY "Users can view their own ticket purchases"
  ON public.ticket_purchases
  FOR SELECT
  USING (auth.uid() = purchaser_id);

-- Event owners can view all tickets for their events
CREATE POLICY "Event owners can view tickets for their events"
  ON public.ticket_purchases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = ticket_purchases.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Event owners can update ticket status (mark as used)
CREATE POLICY "Event owners can update ticket status"
  ON public.ticket_purchases
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = ticket_purchases.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Users can create ticket purchases
CREATE POLICY "Users can create ticket purchases"
  ON public.ticket_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = purchaser_id);

-- Add trigger for updated_at
CREATE TRIGGER update_ticket_purchases_updated_at
  BEFORE UPDATE ON public.ticket_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add ticket design options to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS ticket_design_option text DEFAULT 'auto_generate',
ADD COLUMN IF NOT EXISTS custom_ticket_template text;

-- Add index for faster QR code lookups
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_qr_code ON public.ticket_purchases(qr_code);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_event_id ON public.ticket_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_purchaser_id ON public.ticket_purchases(purchaser_id);