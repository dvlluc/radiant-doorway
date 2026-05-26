-- Add brand_id column to reviews table to support brand reviews
ALTER TABLE public.reviews 
ADD COLUMN brand_id uuid REFERENCES public.brand_profiles(user_id) ON DELETE CASCADE;

-- Add index for brand_id
CREATE INDEX idx_reviews_brand ON public.reviews(brand_id);

-- Update the check constraint so either business_id or brand_id must be set
ALTER TABLE public.reviews 
ALTER COLUMN business_id DROP NOT NULL;

-- Add check to ensure either business_id or brand_id is set (but not both)
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_target_check CHECK (
  (business_id IS NOT NULL AND brand_id IS NULL) OR 
  (business_id IS NULL AND brand_id IS NOT NULL)
);