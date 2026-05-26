-- Add structured location fields to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS street_address text,
ADD COLUMN IF NOT EXISTS city_town text,
ADD COLUMN IF NOT EXISTS state_province text,
ADD COLUMN IF NOT EXISTS zip_postal_code text,
ADD COLUMN IF NOT EXISTS country_region text,
ADD COLUMN IF NOT EXISTS parking_details text,
ADD COLUMN IF NOT EXISTS nearby_hotels text,
ADD COLUMN IF NOT EXISTS transportation text;