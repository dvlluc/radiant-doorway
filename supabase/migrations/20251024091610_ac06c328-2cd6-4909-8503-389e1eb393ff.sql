-- Create appointment_stats table to track business and staff statistics
CREATE TABLE IF NOT EXISTS public.appointment_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_appointments INTEGER NOT NULL DEFAULT 0,
  completed_appointments INTEGER NOT NULL DEFAULT 0,
  cancelled_appointments INTEGER NOT NULL DEFAULT 0,
  no_show_appointments INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, staff_member_id, customer_id)
);

-- Enable RLS
ALTER TABLE public.appointment_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can view their stats"
  ON public.appointment_stats
  FOR SELECT
  USING (auth.uid() = business_id);

CREATE POLICY "Staff members can view their stats"
  ON public.appointment_stats
  FOR SELECT
  USING (auth.uid() = staff_member_id);

CREATE POLICY "System can manage appointment stats"
  ON public.appointment_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to increment staff stats
CREATE OR REPLACE FUNCTION public.increment_staff_stats(
  staff_id UUID,
  business_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.appointment_stats (
    business_id,
    staff_member_id,
    total_appointments,
    completed_appointments
  )
  VALUES (
    business_id,
    staff_id,
    1,
    1
  )
  ON CONFLICT (business_id, staff_member_id, customer_id)
  DO UPDATE SET
    total_appointments = appointment_stats.total_appointments + 1,
    completed_appointments = appointment_stats.completed_appointments + 1,
    updated_at = now();
END;
$$;

-- Create function to increment business stats
CREATE OR REPLACE FUNCTION public.increment_business_stats(
  business_id UUID,
  customer_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.appointment_stats (
    business_id,
    customer_id,
    total_appointments,
    completed_appointments
  )
  VALUES (
    business_id,
    customer_id,
    1,
    1
  )
  ON CONFLICT (business_id, staff_member_id, customer_id)
  DO UPDATE SET
    total_appointments = appointment_stats.total_appointments + 1,
    completed_appointments = appointment_stats.completed_appointments + 1,
    updated_at = now();
END;
$$;

-- Create trigger to update updated_at column
CREATE TRIGGER update_appointment_stats_updated_at
  BEFORE UPDATE ON public.appointment_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add completed_at column to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;