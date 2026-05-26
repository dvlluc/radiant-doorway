-- Add brand_id column to posts table to link reviews to brands
ALTER TABLE public.posts 
ADD COLUMN brand_id uuid REFERENCES public.brand_profiles(id) ON DELETE SET NULL;