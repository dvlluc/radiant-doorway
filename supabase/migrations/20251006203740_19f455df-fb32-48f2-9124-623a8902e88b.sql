-- Add additional fields to team_members table for staff information
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT,
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add comment
COMMENT ON COLUMN public.team_members.phone IS 'Staff member phone number';
COMMENT ON COLUMN public.team_members.specialties IS 'Staff member specialties (comma-separated)';
COMMENT ON COLUMN public.team_members.title IS 'Staff member job title';