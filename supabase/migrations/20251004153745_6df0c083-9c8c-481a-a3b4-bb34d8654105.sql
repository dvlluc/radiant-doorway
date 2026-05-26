-- Drop existing table if it exists
DROP TABLE IF EXISTS public.featured_resumes CASCADE;

-- Create table for featured resume posts
CREATE TABLE public.featured_resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  resume_url TEXT,
  contact_email TEXT NOT NULL,
  avatar_url TEXT,
  display_count INTEGER NOT NULL DEFAULT 0,
  last_displayed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT max_display_count CHECK (display_count <= 2)
);

-- Enable RLS
ALTER TABLE public.featured_resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Featured resumes are viewable by everyone"
ON public.featured_resumes
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own featured resume"
ON public.featured_resumes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (SELECT COUNT(*) FROM public.featured_resumes WHERE is_active = true) < 24
);

CREATE POLICY "Users can update their own featured resume"
ON public.featured_resumes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own featured resume"
ON public.featured_resumes
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_featured_resumes_updated_at
BEFORE UPDATE ON public.featured_resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get current featured resumes (4 posts with rotation)
CREATE OR REPLACE FUNCTION public.get_featured_resumes()
RETURNS TABLE (
  id UUID,
  name TEXT,
  title TEXT,
  bio TEXT,
  resume_url TEXT,
  contact_email TEXT,
  avatar_url TEXT,
  display_count INTEGER,
  last_displayed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically deactivate posts that have been displayed twice
  UPDATE public.featured_resumes
  SET is_active = false
  WHERE display_count >= 2 AND is_active = true;

  -- Return 4 posts for display, prioritizing rotation
  RETURN QUERY
  SELECT 
    fr.id,
    fr.name,
    fr.title,
    fr.bio,
    fr.resume_url,
    fr.contact_email,
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
$$;