-- Busy slots for calendar (no customer PII)
CREATE OR REPLACE FUNCTION public.get_staff_busy_slots(
  p_business_id uuid,
  p_staff_auth_id uuid,
  p_range_start timestamptz,
  p_range_end timestamptz
)
RETURNS TABLE (
  start_time timestamptz,
  end_time timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.start_time, a.end_time
  FROM public.appointments a
  WHERE a.user_id = p_business_id
    AND a.status NOT IN ('cancelled', 'no-show', 'refunded')
    AND a.start_time < p_range_end
    AND a.end_time > p_range_start
    AND (
      p_staff_auth_id IS NULL
      OR a.staff_member_id IS NULL
      OR a.staff_member_id = p_staff_auth_id
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_staff_busy_slots(uuid, uuid, timestamptz, timestamptz) TO authenticated;

-- Prevent double booking at the same business / staff
CREATE OR REPLACE FUNCTION public.prevent_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.user_id = NEW.user_id
      AND a.id IS DISTINCT FROM NEW.id
      AND a.status NOT IN ('cancelled', 'no-show', 'refunded')
      AND a.start_time < NEW.end_time
      AND a.end_time > NEW.start_time
      AND (
        NEW.staff_member_id IS NULL
        OR a.staff_member_id IS NULL
        OR a.staff_member_id = NEW.staff_member_id
      )
  ) THEN
    RAISE EXCEPTION 'TIME_SLOT_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_appointment_overlap ON public.appointments;
CREATE TRIGGER trg_prevent_appointment_overlap
  BEFORE INSERT OR UPDATE OF start_time, end_time, staff_member_id, status, user_id
  ON public.appointments
  FOR EACH ROW
  WHEN (NEW.status NOT IN ('cancelled', 'no-show', 'refunded'))
  EXECUTE FUNCTION public.prevent_appointment_overlap();
