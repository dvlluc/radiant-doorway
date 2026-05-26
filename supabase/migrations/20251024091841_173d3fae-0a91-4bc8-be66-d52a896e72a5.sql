-- Drop the existing unique constraint if it exists
ALTER TABLE public.appointment_stats DROP CONSTRAINT IF EXISTS appointment_stats_business_id_staff_member_id_customer_id_key;

-- Recreate appointment_stats table structure with proper constraints
-- Use separate unique constraints for different stat types
CREATE UNIQUE INDEX IF NOT EXISTS appointment_stats_staff_unique 
  ON public.appointment_stats (business_id, staff_member_id) 
  WHERE staff_member_id IS NOT NULL AND customer_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS appointment_stats_customer_unique 
  ON public.appointment_stats (business_id, customer_id) 
  WHERE customer_id IS NOT NULL AND staff_member_id IS NULL;

-- Update the increment_staff_stats function
CREATE OR REPLACE FUNCTION public.increment_staff_stats(
  staff_id UUID,
  biz_id UUID
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
    customer_id,
    total_appointments,
    completed_appointments
  )
  VALUES (
    biz_id,
    staff_id,
    NULL,
    1,
    1
  )
  ON CONFLICT (business_id, staff_member_id) 
  WHERE staff_member_id IS NOT NULL AND customer_id IS NULL
  DO UPDATE SET
    total_appointments = appointment_stats.total_appointments + 1,
    completed_appointments = appointment_stats.completed_appointments + 1,
    updated_at = now();
END;
$$;

-- Update the increment_business_stats function
CREATE OR REPLACE FUNCTION public.increment_business_stats(
  biz_id UUID,
  cust_id UUID
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
    customer_id,
    total_appointments,
    completed_appointments
  )
  VALUES (
    biz_id,
    NULL,
    cust_id,
    1,
    1
  )
  ON CONFLICT (business_id, customer_id)
  WHERE customer_id IS NOT NULL AND staff_member_id IS NULL
  DO UPDATE SET
    total_appointments = appointment_stats.total_appointments + 1,
    completed_appointments = appointment_stats.completed_appointments + 1,
    updated_at = now();
END;
$$;

-- Create a trigger function to auto-complete arrived appointments after 4 hours
CREATE OR REPLACE FUNCTION public.auto_complete_arrived_appointments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_record RECORD;
  four_hours_ago TIMESTAMP WITH TIME ZONE;
BEGIN
  four_hours_ago := now() - INTERVAL '4 hours';
  
  FOR appointment_record IN
    SELECT * FROM public.appointments
    WHERE status = 'arrived'
      AND checked_in_at < four_hours_ago
  LOOP
    -- Update appointment to completed
    UPDATE public.appointments
    SET status = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE id = appointment_record.id;
    
    -- Update staff stats if applicable
    IF appointment_record.staff_member_id IS NOT NULL THEN
      PERFORM public.increment_staff_stats(
        appointment_record.staff_member_id,
        appointment_record.user_id
      );
    END IF;
    
    -- Update business stats
    IF appointment_record.customer_id IS NOT NULL THEN
      PERFORM public.increment_business_stats(
        appointment_record.user_id,
        appointment_record.customer_id
      );
    END IF;
  END LOOP;
END;
$$;