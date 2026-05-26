-- Create refund_requests table
CREATE TABLE public.refund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_purchase_id UUID NOT NULL,
  requester_id UUID NOT NULL,
  event_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  CONSTRAINT refund_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'processed'))
);

-- Enable RLS
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Requesters can view their own refund requests
CREATE POLICY "Users can view their own refund requests"
  ON public.refund_requests
  FOR SELECT
  USING (auth.uid() = requester_id);

-- Requesters can create refund requests
CREATE POLICY "Users can create refund requests"
  ON public.refund_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Admins can view all refund requests
CREATE POLICY "Admins can view all refund requests"
  ON public.refund_requests
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can update refund requests
CREATE POLICY "Admins can update refund requests"
  ON public.refund_requests
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Create index for performance
CREATE INDEX idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX idx_refund_requests_requester ON public.refund_requests(requester_id);
CREATE INDEX idx_refund_requests_created ON public.refund_requests(created_at DESC);