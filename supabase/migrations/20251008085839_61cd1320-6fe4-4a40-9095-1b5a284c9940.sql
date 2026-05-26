-- Create waiting list table
CREATE TABLE public.waiting_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  staff_member_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  requested_date DATE NOT NULL,
  requested_time TEXT NOT NULL,
  services JSONB NOT NULL,
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- Customers can view their own waiting list entries
CREATE POLICY "Customers can view their own waiting list entries"
ON public.waiting_list
FOR SELECT
USING (auth.uid() = customer_id);

-- Customers can create waiting list entries
CREATE POLICY "Customers can create waiting list entries"
ON public.waiting_list
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Customers can delete their own waiting list entries
CREATE POLICY "Customers can delete their own waiting list entries"
ON public.waiting_list
FOR DELETE
USING (auth.uid() = customer_id);

-- Business owners can view waiting list for their business
CREATE POLICY "Business owners can view their waiting list"
ON public.waiting_list
FOR SELECT
USING (auth.uid() = business_id);

-- Business owners can update waiting list entries
CREATE POLICY "Business owners can update waiting list entries"
ON public.waiting_list
FOR UPDATE
USING (auth.uid() = business_id);

-- Staff members can view their waiting list
CREATE POLICY "Staff members can view their waiting list"
ON public.waiting_list
FOR SELECT
USING (auth.uid() = staff_member_id);

-- Add trigger for updated_at
CREATE TRIGGER update_waiting_list_updated_at
BEFORE UPDATE ON public.waiting_list
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();