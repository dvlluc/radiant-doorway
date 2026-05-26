-- Add array column for multiple images
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- Migrate existing single image_url to image_urls array
UPDATE public.posts 
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_urls = '{}';

-- Keep image_url for backward compatibility but make it nullable
ALTER TABLE public.posts ALTER COLUMN image_url DROP NOT NULL;