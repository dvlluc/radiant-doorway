-- Add photo_type column to business_photos table to distinguish between profile and directory photos
ALTER TABLE business_photos ADD COLUMN photo_type text NOT NULL DEFAULT 'profile';

-- Add check constraint to ensure photo_type is either 'profile' or 'directory'
ALTER TABLE business_photos ADD CONSTRAINT photo_type_check CHECK (photo_type IN ('profile', 'directory'));

-- Create index for faster queries
CREATE INDEX idx_business_photos_photo_type ON business_photos(user_id, photo_type);