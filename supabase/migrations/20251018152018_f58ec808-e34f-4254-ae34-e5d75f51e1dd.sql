-- Create function to decrement available ticket count
CREATE OR REPLACE FUNCTION public.decrement_ticket_count(ticket_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.event_tickets
  SET available_tickets = GREATEST(COALESCE(available_tickets, 0) - amount, 0)
  WHERE id = ticket_id;
END;
$$;