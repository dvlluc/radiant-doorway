-- Create brand_profiles table for brand accounts
CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  website TEXT,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for brand_profiles
CREATE POLICY "Brand profiles are viewable by everyone" 
ON public.brand_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own brand profile" 
ON public.brand_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand profile" 
ON public.brand_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_brand_profiles_updated_at
BEFORE UPDATE ON public.brand_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.brand_profiles IS 'Stores brand-specific account information separate from individual profiles';