-- Add launch_date column to posts table
ALTER TABLE public.posts 
ADD COLUMN launch_date date;

COMMENT ON COLUMN public.posts.launch_date IS 'The launch date for launch type posts';