
CREATE TABLE public.bellomart_seller_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_type TEXT NOT NULL,
  product_category TEXT NOT NULL,
  expected_sales_volume TEXT,
  website TEXT,
  virtual_tryon_interest TEXT,
  shipping_interest TEXT,
  about_business TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bellomart_seller_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit their own interest"
ON public.bellomart_seller_interests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own submissions"
ON public.bellomart_seller_interests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions"
ON public.bellomart_seller_interests
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_bellomart_seller_interests_updated_at
BEFORE UPDATE ON public.bellomart_seller_interests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
