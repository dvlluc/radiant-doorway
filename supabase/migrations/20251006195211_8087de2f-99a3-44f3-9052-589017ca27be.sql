-- Add constraint to limit bio to 40 characters for profiles table (individuals)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_bio_length CHECK (char_length(bio) <= 40);