-- Add rating, tags, and hashtags columns to posts table
ALTER TABLE public.posts
ADD COLUMN rating integer CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN tags text[],
ADD COLUMN hashtags text;