-- Add apply_by_date column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN apply_by_date date;