-- Add post_type column to posts table
ALTER TABLE public.posts 
ADD COLUMN post_type text DEFAULT 'post' CHECK (post_type IN ('tip', 'question', 'video', 'review', 'post'));