-- Add avatar_url column to business_profiles
ALTER TABLE public.business_profiles
ADD COLUMN avatar_url TEXT;

-- Add avatar_url column to brand_profiles
ALTER TABLE public.brand_profiles
ADD COLUMN avatar_url TEXT;

-- Add avatar_url column to charitable_profiles
ALTER TABLE public.charitable_profiles
ADD COLUMN avatar_url TEXT;