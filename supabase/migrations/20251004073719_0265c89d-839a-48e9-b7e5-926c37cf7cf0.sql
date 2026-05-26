-- Add registration_number to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS registration_number INTEGER;

-- Create a sequence for registration numbers
CREATE SEQUENCE IF NOT EXISTS public.profile_registration_seq START WITH 1;

-- Create a function to set registration number on profile creation
CREATE OR REPLACE FUNCTION public.set_registration_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only set if not already set
  IF NEW.registration_number IS NULL THEN
    NEW.registration_number := nextval('public.profile_registration_seq');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-set registration number
DROP TRIGGER IF EXISTS set_registration_number_trigger ON public.profiles;
CREATE TRIGGER set_registration_number_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_registration_number();

-- Update existing profiles with registration numbers (in order of creation)
WITH numbered_profiles AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.profiles
  WHERE registration_number IS NULL
)
UPDATE public.profiles p
SET registration_number = np.rn
FROM numbered_profiles np
WHERE p.id = np.id;