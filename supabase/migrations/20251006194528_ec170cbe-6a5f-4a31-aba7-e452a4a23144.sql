-- Add about_us field to business_profiles
ALTER TABLE public.business_profiles
ADD COLUMN about_us text;

-- Add about_us field to brand_profiles
ALTER TABLE public.brand_profiles
ADD COLUMN about_us text;

-- Add about_us field to charitable_profiles
ALTER TABLE public.charitable_profiles
ADD COLUMN about_us text;

-- Add constraint to limit about_us to 80 characters
ALTER TABLE public.business_profiles
ADD CONSTRAINT business_profiles_about_us_length CHECK (char_length(about_us) <= 80);

ALTER TABLE public.brand_profiles
ADD CONSTRAINT brand_profiles_about_us_length CHECK (char_length(about_us) <= 80);

ALTER TABLE public.charitable_profiles
ADD CONSTRAINT charitable_profiles_about_us_length CHECK (char_length(about_us) <= 80);