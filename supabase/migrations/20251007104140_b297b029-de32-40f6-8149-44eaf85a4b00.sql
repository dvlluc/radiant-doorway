-- Add profile completion fields to profiles table for individual users
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS wants_premium boolean,
ADD COLUMN IF NOT EXISTS wants_booking boolean,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;