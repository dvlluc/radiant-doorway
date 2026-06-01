-- In-app notifications when a customer books an appointment
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_name text;
  business_name text;
  formatted_when text;
  service_label text;
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('scheduled', 'confirmed') THEN
    RETURN NEW;
  END IF;

  service_label := COALESCE(NULLIF(trim(NEW.service_type), ''), NULLIF(trim(NEW.title), ''), 'a service');
  formatted_when := to_char(NEW.start_time, 'FMMon DD, YYYY "at" HH12:MI AM');

  SELECT COALESCE(
    NULLIF(trim(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''),
    'A customer'
  )
  INTO customer_name
  FROM public.profiles p
  WHERE p.id = NEW.customer_id;

  SELECT COALESCE(NULLIF(trim(bp.business_name), ''), 'the business')
  INTO business_name
  FROM public.business_profiles bp
  WHERE bp.user_id = NEW.user_id;

  IF business_name IS NULL THEN
    business_name := 'the business';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, read, action_url)
  VALUES (
    NEW.customer_id,
    'booking',
    'Booking Confirmed',
    format(
      'Your appointment for %s at %s is scheduled for %s.',
      service_label,
      business_name,
      formatted_when
    ),
    false,
    '/account?tab=bookings'
  );

  IF NEW.user_id IS NOT NULL AND NEW.user_id IS DISTINCT FROM NEW.customer_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, read, action_url)
    VALUES (
      NEW.user_id,
      'booking',
      'New Booking',
      format(
        '%s booked %s for %s.',
        customer_name,
        service_label,
        formatted_when
      ),
      false,
      '/account?tab=business-bookings'
    );
  END IF;

  IF NEW.staff_member_id IS NOT NULL
     AND NEW.staff_member_id IS DISTINCT FROM NEW.user_id
     AND NEW.staff_member_id IS DISTINCT FROM NEW.customer_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, read, action_url)
    VALUES (
      NEW.staff_member_id,
      'booking',
      'New Appointment',
      format(
        '%s booked %s for %s.',
        customer_name,
        service_label,
        formatted_when
      ),
      false,
      '/account?tab=business-bookings'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_appointment_created_notify ON public.appointments;
CREATE TRIGGER on_appointment_created_notify
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_appointment();
