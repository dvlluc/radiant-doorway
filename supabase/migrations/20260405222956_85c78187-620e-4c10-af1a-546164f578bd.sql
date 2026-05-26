
-- Create styles table
CREATE TABLE public.styles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL,
  style_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'hair',
  photo_url TEXT NOT NULL,
  description TEXT,
  services_required TEXT[] DEFAULT '{}'::TEXT[],
  estimated_time INTEGER, -- minutes
  estimated_price NUMERIC,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT styles_category_check CHECK (category IN ('hair', 'nails', 'lashes', 'barber', 'makeup', 'braids'))
);

-- Enable RLS
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Styles are viewable by everyone"
  ON public.styles FOR SELECT USING (true);

CREATE POLICY "Professionals can create their own styles"
  ON public.styles FOR INSERT
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionals can update their own styles"
  ON public.styles FOR UPDATE
  USING (auth.uid() = professional_id);

CREATE POLICY "Professionals can delete their own styles"
  ON public.styles FOR DELETE
  USING (auth.uid() = professional_id);

-- Trigger for updated_at
CREATE TRIGGER update_styles_updated_at
  BEFORE UPDATE ON public.styles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for category filtering
CREATE INDEX idx_styles_category ON public.styles(category);
CREATE INDEX idx_styles_professional_id ON public.styles(professional_id);

-- Create saved_styles table
CREATE TABLE public.saved_styles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  style_id UUID NOT NULL REFERENCES public.styles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, style_id)
);

-- Enable RLS
ALTER TABLE public.saved_styles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their saved styles"
  ON public.saved_styles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save styles"
  ON public.saved_styles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave styles"
  ON public.saved_styles FOR DELETE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_saved_styles_user_id ON public.saved_styles(user_id);

-- Add storage bucket for style photos
INSERT INTO storage.buckets (id, name, public) VALUES ('style-photos', 'style-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for style photos
CREATE POLICY "Style photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'style-photos');

CREATE POLICY "Authenticated users can upload style photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'style-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own style photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'style-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own style photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'style-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
