-- Create event_tickets table for multiple ticket types per event
CREATE TABLE IF NOT EXISTS public.event_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_name text NOT NULL,
  ticket_description text,
  price numeric NOT NULL,
  booking_fee numeric DEFAULT 0,
  total_tickets integer,
  available_tickets integer,
  sales_end_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

-- Tickets are viewable by everyone
CREATE POLICY "Event tickets are viewable by everyone"
  ON public.event_tickets
  FOR SELECT
  USING (true);

-- Event owners can manage their event tickets
CREATE POLICY "Event owners can manage their tickets"
  ON public.event_tickets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_tickets.event_id
      AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_tickets.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_event_tickets_updated_at
  BEFORE UPDATE ON public.event_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();