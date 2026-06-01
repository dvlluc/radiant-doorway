-- Shared helpers and UPDATE trigger for all appointment / booking changes

CREATE OR REPLACE FUNCTION public.appointment_notification_context(
  p_customer_id uuid,
  p_business_id uuid,
  p_service_type text,
  p_title text,
  p_start_time timestamptz
)
RETURNS TABLE (
  customer_name text,
  business_name text,
  service_label text,
  formatted_when text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  customer_name := 'A customer';
  business_name := 'the business';
  service_label := COALESCE(NULLIF(trim(p_service_type), ''), NULLIF(trim(p_title), ''), 'a service');
  formatted_when := to_char(p_start_time, 'FMMon DD, YYYY "at" HH12:MI AM');

  IF p_customer_id IS NOT NULL THEN
    SELECT COALESCE(
      NULLIF(trim(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''),
      'A customer'
    )
    INTO customer_name
    FROM public.profiles p
    WHERE p.id = p_customer_id;
  END IF;

  IF p_business_id IS NOT NULL THEN
    SELECT COALESCE(NULLIF(trim(bp.business_name), ''), 'the business')
    INTO business_name
    FROM public.business_profiles bp
    WHERE bp.user_id = p_business_id;
  END IF;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_booking_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_action_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, read, action_url)
  VALUES (p_user_id, 'booking', p_title, p_message, false, p_action_url);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_appointment_recipients(
  p_customer_id uuid,
  p_business_id uuid,
  p_staff_id uuid,
  p_customer_title text,
  p_customer_message text,
  p_business_title text,
  p_business_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_customer_id IS NOT NULL THEN
    PERFORM public.insert_booking_notification(
      p_customer_id,
      p_customer_title,
      p_customer_message,
      '/account?tab=bookings'
    );
  END IF;

  IF p_business_id IS NOT NULL AND p_business_id IS DISTINCT FROM p_customer_id THEN
    PERFORM public.insert_booking_notification(
      p_business_id,
      p_business_title,
      p_business_message,
      '/account?tab=business-bookings'
    );
  END IF;

  IF p_staff_id IS NOT NULL
     AND p_staff_id IS DISTINCT FROM p_business_id
     AND p_staff_id IS DISTINCT FROM p_customer_id THEN
    PERFORM public.insert_booking_notification(
      p_staff_id,
      p_business_title,
      p_business_message,
      '/account?tab=business-bookings'
    );
  END IF;
END;
$$;

-- New booking (refactored to use shared helpers)
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ctx record;
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('scheduled', 'confirmed') THEN
    RETURN NEW;
  END IF;

  SELECT * INTO ctx
  FROM public.appointment_notification_context(
    NEW.customer_id,
    NEW.user_id,
    NEW.service_type,
    NEW.title,
    NEW.start_time
  );

  PERFORM public.notify_appointment_recipients(
    NEW.customer_id,
    NEW.user_id,
    NEW.staff_member_id,
    'Booking Confirmed',
    format(
      'Your appointment for %s at %s is scheduled for %s.',
      ctx.service_label,
      ctx.business_name,
      ctx.formatted_when
    ),
    'New Booking',
    format(
      '%s booked %s for %s.',
      ctx.customer_name,
      ctx.service_label,
      ctx.formatted_when
    )
  );

  RETURN NEW;
END;
$$;

-- Cancellations, reschedule, status changes, check-in, completion, etc.
CREATE OR REPLACE FUNCTION public.notify_appointment_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ctx record;
  v_old_when text;
  v_new_when text;
  v_customer_title text;
  v_customer_message text;
  v_business_title text;
  v_business_message text;
  v_status_label text;
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status
     AND OLD.start_time IS NOT DISTINCT FROM NEW.start_time
     AND OLD.end_time IS NOT DISTINCT FROM NEW.end_time
     AND OLD.staff_member_id IS NOT DISTINCT FROM NEW.staff_member_id THEN
    RETURN NEW;
  END IF;

  SELECT * INTO ctx
  FROM public.appointment_notification_context(
    NEW.customer_id,
    NEW.user_id,
    NEW.service_type,
    NEW.title,
    NEW.start_time
  );

  v_old_when := to_char(OLD.start_time, 'FMMon DD, YYYY "at" HH12:MI AM');
  v_new_when := ctx.formatted_when;
  v_status_label := initcap(replace(NEW.status, '-', ' '));

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'cancelled' THEN
        v_customer_title := 'Booking Cancelled';
        v_customer_message := format(
          'Your appointment for %s at %s on %s has been cancelled.',
          ctx.service_label,
          ctx.business_name,
          v_new_when
        );
        v_business_title := 'Booking Cancelled';
        v_business_message := format(
          'The appointment with %s for %s on %s was cancelled.',
          ctx.customer_name,
          ctx.service_label,
          v_new_when
        );

      WHEN 'completed' THEN
        v_customer_title := 'Appointment Completed';
        v_customer_message := format(
          'Your appointment for %s at %s on %s is marked as completed.',
          ctx.service_label,
          ctx.business_name,
          v_new_when
        );
        v_business_title := 'Appointment Completed';
        v_business_message := format(
          'The appointment with %s for %s on %s was completed.',
          ctx.customer_name,
          ctx.service_label,
          v_new_when
        );

      WHEN 'no-show' THEN
        v_customer_title := 'Missed Appointment';
        v_customer_message := format(
          'Your appointment for %s at %s on %s was marked as a no-show.',
          ctx.service_label,
          ctx.business_name,
          v_new_when
        );
        v_business_title := 'No-Show Recorded';
        v_business_message := format(
          '%s did not attend their %s appointment on %s.',
          ctx.customer_name,
          ctx.service_label,
          v_new_when
        );

      WHEN 'refunded' THEN
        v_customer_title := 'Booking Refunded';
        v_customer_message := format(
          'Your appointment for %s at %s on %s has been refunded.',
          ctx.service_label,
          ctx.business_name,
          v_new_when
        );
        v_business_title := 'Booking Refunded';
        v_business_message := format(
          'The appointment with %s for %s on %s was refunded.',
          ctx.customer_name,
          ctx.service_label,
          v_new_when
        );

      WHEN 'arrived' THEN
        v_customer_title := 'Checked In';
        v_customer_message := format(
          'You have been checked in for your %s appointment at %s (%s).',
          ctx.service_label,
          ctx.business_name,
          v_new_when
        );
        v_business_title := 'Client Checked In';
        v_business_message := format(
          '%s checked in for %s at %s.',
          ctx.customer_name,
          ctx.service_label,
          v_new_when
        );

      WHEN 'rescheduled' THEN
        v_customer_title := 'Booking Rescheduled';
        v_business_title := 'Booking Rescheduled';
        IF OLD.start_time IS DISTINCT FROM NEW.start_time THEN
          v_customer_message := format(
            'Your appointment for %s at %s moved from %s to %s.',
            ctx.service_label,
            ctx.business_name,
            v_old_when,
            v_new_when
          );
          v_business_message := format(
            'The appointment with %s for %s moved from %s to %s.',
            ctx.customer_name,
            ctx.service_label,
            v_old_when,
            v_new_when
          );
        ELSE
          v_customer_message := format(
            'Your appointment for %s at %s is marked as rescheduled.',
            ctx.service_label,
            ctx.business_name,
            v_new_when
          );
          v_business_message := format(
            'The appointment with %s for %s is marked as rescheduled.',
            ctx.customer_name,
            ctx.service_label,
            v_new_when
          );
        END IF;

      WHEN 'confirmed' THEN
        IF OLD.status NOT IN ('scheduled', 'confirmed') THEN
          v_customer_title := 'Booking Confirmed';
          v_customer_message := format(
            'Your appointment for %s at %s on %s is confirmed.',
            ctx.service_label,
            ctx.business_name,
            v_new_when
          );
          v_business_title := 'Booking Confirmed';
          v_business_message := format(
            'The appointment with %s for %s on %s is confirmed.',
            ctx.customer_name,
            ctx.service_label,
            v_new_when
          );
        ELSE
          RETURN NEW;
        END IF;

      ELSE
        v_customer_title := 'Booking Updated';
        v_customer_message := format(
          'Your appointment for %s at %s on %s is now %s.',
          ctx.service_label,
          ctx.business_name,
          v_new_when,
          v_status_label
        );
        v_business_title := 'Booking Updated';
        v_business_message := format(
          'The appointment with %s for %s on %s is now %s.',
          ctx.customer_name,
          ctx.service_label,
          v_new_when,
          v_status_label
        );
    END CASE;

    PERFORM public.notify_appointment_recipients(
      NEW.customer_id,
      NEW.user_id,
      NEW.staff_member_id,
      v_customer_title,
      v_customer_message,
      v_business_title,
      v_business_message
    );

  ELSIF OLD.start_time IS DISTINCT FROM NEW.start_time
     OR OLD.end_time IS DISTINCT FROM NEW.end_time THEN
    v_customer_title := 'Booking Rescheduled';
    v_customer_message := format(
      'Your appointment for %s at %s moved from %s to %s.',
      ctx.service_label,
      ctx.business_name,
      v_old_when,
      v_new_when
    );
    v_business_title := 'Booking Rescheduled';
    v_business_message := format(
      'The appointment with %s for %s moved from %s to %s.',
      ctx.customer_name,
      ctx.service_label,
      v_old_when,
      v_new_when
    );

    PERFORM public.notify_appointment_recipients(
      NEW.customer_id,
      NEW.user_id,
      NEW.staff_member_id,
      v_customer_title,
      v_customer_message,
      v_business_title,
      v_business_message
    );

  ELSIF OLD.staff_member_id IS DISTINCT FROM NEW.staff_member_id THEN
    v_customer_title := 'Staff Updated';
    v_customer_message := format(
      'Your appointment for %s at %s on %s has a new assigned professional.',
      ctx.service_label,
      ctx.business_name,
      v_new_when
    );
    v_business_title := 'Staff Reassigned';
    v_business_message := format(
      'The appointment with %s for %s on %s was reassigned to another team member.',
      ctx.customer_name,
      ctx.service_label,
      v_new_when
    );

    PERFORM public.notify_appointment_recipients(
      NEW.customer_id,
      NEW.user_id,
      NEW.staff_member_id,
      v_customer_title,
      v_customer_message,
      v_business_title,
      v_business_message
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_appointment_updated_notify ON public.appointments;
CREATE TRIGGER on_appointment_updated_notify
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_appointment_updated();
