-- Add business_id column to posts table for reviews
ALTER TABLE public.posts
ADD COLUMN business_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_posts_business_id ON public.posts(business_id);

-- Add comment to explain the column
COMMENT ON COLUMN public.posts.business_id IS 'References the business being reviewed (only for review posts)';