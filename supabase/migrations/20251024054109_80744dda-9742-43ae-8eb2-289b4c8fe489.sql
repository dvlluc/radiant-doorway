-- Fix profiles table RLS to protect PII (email, telephone)
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Allow users to view their own full profile
CREATE POLICY "Users can view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a public view that only exposes safe fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  username,
  avatar_url,
  bio,
  display_name,
  interests,
  created_at
FROM public.profiles;

-- Allow everyone to view the public profile view
GRANT SELECT ON public.public_profiles TO anon, authenticated;