-- Create business_profiles table for business accounts
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  website TEXT,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create charitable_profiles table for charitable partner accounts
CREATE TABLE IF NOT EXISTS public.charitable_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  registration_number TEXT NOT NULL,
  website TEXT,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charitable_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for business_profiles
CREATE POLICY "Business profiles are viewable by everyone" 
ON public.business_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own business profile" 
ON public.business_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profile" 
ON public.business_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for charitable_profiles
CREATE POLICY "Charitable profiles are viewable by everyone" 
ON public.charitable_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own charitable profile" 
ON public.charitable_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own charitable profile" 
ON public.charitable_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_business_profiles_updated_at
BEFORE UPDATE ON public.business_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_charitable_profiles_updated_at
BEFORE UPDATE ON public.charitable_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.business_profiles IS 'Stores business account information';
COMMENT ON TABLE public.charitable_profiles IS 'Stores charitable partner organization information';