
-- Account type on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'individual'
    CHECK (account_type IN ('individual','business')),
  ADD COLUMN IF NOT EXISTS business_name text;

-- Update handle_new_user trigger fn to capture account_type + business_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, account_type, business_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'individual'),
    NEW.raw_user_meta_data->>'business_name'
  );
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow public read of profiles (so individuals can see business names)
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_public_read ON public.profiles FOR SELECT TO anon, authenticated USING (true);

-- Services: link to a business owner
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_services_business ON public.services(business_id);

-- Business can manage their own services
DROP POLICY IF EXISTS services_business_insert ON public.services;
CREATE POLICY services_business_insert ON public.services FOR INSERT TO authenticated
  WITH CHECK (business_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.account_type = 'business'));

DROP POLICY IF EXISTS services_business_update ON public.services;
CREATE POLICY services_business_update ON public.services FOR UPDATE TO authenticated
  USING (business_id = auth.uid());

DROP POLICY IF EXISTS services_business_delete ON public.services;
CREATE POLICY services_business_delete ON public.services FOR DELETE TO authenticated
  USING (business_id = auth.uid());

-- Bookings: business can see bookings for their services
DROP POLICY IF EXISTS bookings_business_select ON public.bookings;
CREATE POLICY bookings_business_select ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.business_id = auth.uid()));

DROP POLICY IF EXISTS bookings_business_update ON public.bookings;
CREATE POLICY bookings_business_update ON public.bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.business_id = auth.uid()));

DROP POLICY IF EXISTS bookings_business_delete ON public.bookings;
CREATE POLICY bookings_business_delete ON public.bookings FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.business_id = auth.uid()));

-- Business vacations / blocked days
CREATE TABLE IF NOT EXISTS public.business_vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, day)
);

ALTER TABLE public.business_vacations ENABLE ROW LEVEL SECURITY;

CREATE POLICY vacations_public_read ON public.business_vacations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY vacations_owner_insert ON public.business_vacations FOR INSERT TO authenticated
  WITH CHECK (business_id = auth.uid());
CREATE POLICY vacations_owner_delete ON public.business_vacations FOR DELETE TO authenticated
  USING (business_id = auth.uid());
