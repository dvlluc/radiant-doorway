ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS business_categories text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS requirements text,
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}'::text[];

UPDATE public.services
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND (image_urls IS NULL OR image_urls = '{}'::text[]);

INSERT INTO storage.buckets (id, name, public)
VALUES ('service-photos', 'service-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Service photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-photos');

CREATE POLICY "Users can upload service photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'service-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their service photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'service-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their service photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'service-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
