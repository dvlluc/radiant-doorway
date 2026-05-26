-- Add missing columns to business_profiles
ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS wants_premium boolean,
ADD COLUMN IF NOT EXISTS wants_booking boolean,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS logo_url text;

-- Add missing columns to brand_profiles
ALTER TABLE public.brand_profiles
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS wants_premium boolean,
ADD COLUMN IF NOT EXISTS wants_booking boolean,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS logo_url text;

-- Add missing columns to charitable_profiles
ALTER TABLE public.charitable_profiles
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS wants_premium boolean,
ADD COLUMN IF NOT EXISTS wants_booking boolean,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS logo_url text;