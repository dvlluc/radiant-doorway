-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Create jobs table to store job postings
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  salary TEXT NOT NULL,
  salary_min NUMERIC,
  salary_max NUMERIC,
  experience TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL DEFAULT '{}',
  benefits TEXT[] NOT NULL DEFAULT '{}',
  application_method TEXT NOT NULL CHECK (application_method IN ('phone', 'upload', 'linkedin', 'form')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Jobs are viewable by everyone
CREATE POLICY "Jobs are viewable by everyone"
  ON public.jobs
  FOR SELECT
  USING (true);

-- Users can create their own jobs
CREATE POLICY "Users can create their own jobs"
  ON public.jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs
CREATE POLICY "Users can update their own jobs"
  ON public.jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own jobs
CREATE POLICY "Users can delete their own jobs"
  ON public.jobs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poster_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  education TEXT,
  experiences JSONB,
  supporting_statements TEXT,
  interview_availability TEXT,
  applicant_references TEXT,
  cover_letter TEXT,
  resume_url TEXT,
  linkedin_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can view their own applications
CREATE POLICY "Applicants can view their own applications"
  ON public.job_applications
  FOR SELECT
  USING (auth.uid() = applicant_id);

-- Job posters can view applications for their jobs
CREATE POLICY "Job posters can view applications for their jobs"
  ON public.job_applications
  FOR SELECT
  USING (auth.uid() = poster_id);

-- Users can create applications
CREATE POLICY "Users can create applications"
  ON public.job_applications
  FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

-- Applicants can update their own applications
CREATE POLICY "Applicants can update their own applications"
  ON public.job_applications
  FOR UPDATE
  USING (auth.uid() = applicant_id);

-- Job posters can update application status
CREATE POLICY "Job posters can update application status"
  ON public.job_applications
  FOR UPDATE
  USING (auth.uid() = poster_id);

-- Add trigger for updated_at on jobs
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on job_applications
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();