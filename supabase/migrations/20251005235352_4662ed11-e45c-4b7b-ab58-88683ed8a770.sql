-- Add status column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

-- Add check constraint for status
ALTER TABLE public.jobs
ADD CONSTRAINT jobs_status_check 
CHECK (status IN ('active', 'draft', 'expired'));