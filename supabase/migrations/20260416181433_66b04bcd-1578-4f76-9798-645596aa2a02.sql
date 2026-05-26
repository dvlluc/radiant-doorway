-- Create waitlist signups table
CREATE TABLE public.bellomart_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'join_waitlist',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bellomart_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can insert a waitlist signup
CREATE POLICY "Anyone can join the waitlist"
ON public.bellomart_waitlist
FOR INSERT
WITH CHECK (true);

-- Only admins can view waitlist signups
CREATE POLICY "Admins can view waitlist signups"
ON public.bellomart_waitlist
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Helpful index for lookups
CREATE INDEX idx_bellomart_waitlist_email ON public.bellomart_waitlist(email);