CREATE OR REPLACE FUNCTION public.cancel_customer_appointment(
  p_appointment_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment public.appointments%ROWTYPE;
BEGIN
  SELECT *
  INTO v_appointment
  FROM public.appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'APPOINTMENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF v_appointment.customer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.appointment_status_blocks_booking(v_appointment.status) THEN
    RAISE EXCEPTION 'APPOINTMENT_NOT_CANCELLABLE' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.appointments
  SET
    status = 'cancelled',
    description = CASE
      WHEN p_reason IS NOT NULL AND btrim(p_reason) <> '' THEN
        COALESCE(v_appointment.description || E'\n', '') || 'Cancelled by customer: ' || btrim(p_reason)
      ELSE
        COALESCE(v_appointment.description || E'\n', '') || 'Cancelled by customer'
    END
  WHERE id = p_appointment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_customer_appointment(uuid, text) TO authenticated;
