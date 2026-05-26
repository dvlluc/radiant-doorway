-- Add personal information fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS telephone TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add comment to clarify the difference between username and display_name
COMMENT ON COLUMN public.profiles.display_name IS 'Optional public display name shown on the platform';
COMMENT ON COLUMN public.profiles.username IS 'Unique username for the user';