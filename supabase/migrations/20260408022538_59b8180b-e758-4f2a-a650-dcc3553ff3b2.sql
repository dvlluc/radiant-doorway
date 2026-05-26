-- Create storage bucket for booking hair photos
INSERT INTO storage.buckets (id, name, public) VALUES ('booking-photos', 'booking-photos', true);

-- Allow public read access
CREATE POLICY "Booking photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'booking-photos');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own booking photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'booking-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own photos
CREATE POLICY "Users can update their own booking photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'booking-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own booking photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'booking-photos' AND auth.uid()::text = (storage.foldername(name))[1]);