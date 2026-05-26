-- Add first_name column to featured_resumes
ALTER TABLE public.featured_resumes 
ADD COLUMN IF NOT EXISTS first_name text;

-- For existing records, extract first name from the name field
UPDATE public.featured_resumes
SET first_name = split_part(name, ' ', 1)
WHERE first_name IS NULL;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_featured_resumes();

-- Recreate the function to return only first_name (not full name or contact info)
CREATE OR REPLACE FUNCTION public.get_featured_resumes()
RETURNS TABLE(
  id uuid,
  first_name text,
  title text,
  bio text,
  resume_url text,
  linkedin_url text,
  avatar_url text,
  display_count integer,
  last_displayed_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Automatically deactivate posts that have been displayed twice
  UPDATE public.featured_resumes
  SET is_active = false
  WHERE display_count >= 2 AND is_active = true;

  -- Return 4 posts for display, prioritizing rotation
  -- Note: contact_email and phone are NOT returned for privacy
  RETURN QUERY
  SELECT 
    fr.id,
    fr.first_name,
    fr.title,
    fr.bio,
    fr.resume_url,
    fr.linkedin_url,
    fr.avatar_url,
    fr.display_count,
    fr.last_displayed_at
  FROM public.featured_resumes fr
  WHERE fr.is_active = true 
    AND fr.display_count < 2
    AND (
      fr.last_displayed_at IS NULL 
      OR fr.last_displayed_at < NOW() - INTERVAL '3 days'
    )
  ORDER BY 
    fr.last_displayed_at NULLS FIRST,
    fr.created_at ASC
  LIMIT 4;
END;
$function$;