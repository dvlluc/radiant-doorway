-- Normalized status check: cancelled / no-show / refunded do not block the calendar
CREATE OR REPLACE FUNCTION public.appointment_status_blocks_booking(p_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(replace(coalesce(p_status, ''), '_', '-')) NOT IN (
    'cancelled',
    'no-show',
    'refunded',
    'removed'
  );
$$;

-- Busy slots for calendar (start/end only, no customer PII)
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
    AND p_range_end > p_range_start
    AND public.appointment_status_blocks_booking(a.status)
    AND a.start_time < p_range_end
    AND a.end_time > p_range_start
    AND (
      p_staff_auth_id IS NULL
      OR a.staff_member_id IS NULL
      OR a.staff_member_id = p_staff_auth_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.business_profiles bp
      WHERE bp.user_id = p_business_id
    );
$$;

REVOKE ALL ON FUNCTION public.get_staff_busy_slots(uuid, uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_staff_busy_slots(uuid, uuid, timestamptz, timestamptz) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_appointments_booking_overlap
  ON public.appointments (user_id, start_time, end_time)
  WHERE public.appointment_status_blocks_booking(status);

-- Prevent double booking at the same business / staff
CREATE OR REPLACE FUNCTION public.prevent_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.appointment_status_blocks_booking(NEW.status) THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.user_id = NEW.user_id
      AND a.id IS DISTINCT FROM NEW.id
      AND public.appointment_status_blocks_booking(a.status)
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
  EXECUTE FUNCTION public.prevent_appointment_overlap();
