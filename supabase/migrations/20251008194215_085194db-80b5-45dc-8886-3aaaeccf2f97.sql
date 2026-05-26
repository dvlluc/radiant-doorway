-- Add products column to posts table to store product information
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS products jsonb DEFAULT NULL;

COMMENT ON COLUMN public.posts.products IS 'Array of products used in the post with name and price';