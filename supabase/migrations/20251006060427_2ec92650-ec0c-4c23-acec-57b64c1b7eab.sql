-- Add education_requirements field to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS education_requirements text;

-- Add application_details field for storing additional application method info
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS application_details jsonb DEFAULT '{}'::jsonb;