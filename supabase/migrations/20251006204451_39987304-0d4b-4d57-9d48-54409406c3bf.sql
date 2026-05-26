-- Add staff_member_id to appointments table to track which staff member handles the appointment
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS staff_member_id UUID REFERENCES auth.users(id);

-- Create blocked_time table for staff to block out unavailable time slots
CREATE TABLE IF NOT EXISTS public.blocked_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on blocked_time
ALTER TABLE public.blocked_time ENABLE ROW LEVEL SECURITY;

-- Staff members can manage their own blocked time
CREATE POLICY "Staff can manage their own blocked time"
ON public.blocked_time
FOR ALL
USING (auth.uid() = staff_member_id)
WITH CHECK (auth.uid() = staff_member_id);

-- Business owners can view blocked time for their team members
CREATE POLICY "Business owners can view team blocked time"
ON public.blocked_time
FOR SELECT
USING (
  business_id = auth.uid()
);

-- Update RLS policies on appointments to allow staff members to view their appointments
CREATE POLICY "Staff members can view their appointments"
ON public.appointments
FOR SELECT
USING (auth.uid() = staff_member_id);

-- Staff members can update their appointments
CREATE POLICY "Staff members can update their appointments"
ON public.appointments
FOR UPDATE
USING (auth.uid() = staff_member_id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_staff_member ON public.appointments(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_blocked_time_staff_member ON public.blocked_time(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_blocked_time_business ON public.blocked_time(business_id);

COMMENT ON COLUMN public.appointments.staff_member_id IS 'The staff member assigned to this appointment';
COMMENT ON TABLE public.blocked_time IS 'Blocked time slots where staff members are unavailable';