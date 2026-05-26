-- Business Settings Table
CREATE TABLE public.business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  appointment_booking_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage their own settings"
ON public.business_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Business Hours Table
CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week text NOT NULL,
  is_open boolean NOT NULL DEFAULT true,
  open_time text,
  close_time text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage their hours"
ON public.business_hours
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view business hours"
ON public.business_hours
FOR SELECT
USING (true);

-- Business Photos Table
CREATE TABLE public.business_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.business_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage their photos"
ON public.business_photos
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view business photos"
ON public.business_photos
FOR SELECT
USING (true);

-- Team Members Table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage their team"
ON public.team_members
FOR ALL
USING (auth.uid() = business_id)
WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Team members can view their invitations"
ON public.team_members
FOR SELECT
USING (auth.uid() = member_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Team members can update their status"
ON public.team_members
FOR UPDATE
USING (auth.uid() = member_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (auth.uid() = member_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Services Table
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  duration integer NOT NULL,
  staff_ids uuid[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage their services"
ON public.services
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view active services"
ON public.services
FOR SELECT
USING (is_active = true);

-- Customer Records Table
CREATE TABLE public.customer_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notes text,
  medical_conditions text,
  special_requirements text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(business_id, customer_id)
);

ALTER TABLE public.customer_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage customer records"
ON public.customer_records
FOR ALL
USING (auth.uid() = business_id)
WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Customers can view their own records"
ON public.customer_records
FOR SELECT
USING (auth.uid() = customer_id);

-- Restricted Customers Table
CREATE TABLE public.restricted_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text,
  restriction_type text NOT NULL DEFAULT '30_days',
  restricted_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(business_id, customer_id)
);

ALTER TABLE public.restricted_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage restricted customers"
ON public.restricted_customers
FOR ALL
USING (auth.uid() = business_id)
WITH CHECK (auth.uid() = business_id);

-- Business Forms Table
CREATE TABLE public.business_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  template jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.business_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses can manage their forms"
ON public.business_forms
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_business_settings_updated_at
BEFORE UPDATE ON public.business_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_records_updated_at
BEFORE UPDATE ON public.customer_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_forms_updated_at
BEFORE UPDATE ON public.business_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();