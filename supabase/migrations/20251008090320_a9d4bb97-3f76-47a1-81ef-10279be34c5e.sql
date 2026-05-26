-- Add expiration timestamp and item type to cart_items
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'product',
ADD COLUMN IF NOT EXISTS item_data JSONB;

-- Create index for efficient expiration cleanup
CREATE INDEX IF NOT EXISTS idx_cart_items_expires_at ON public.cart_items(expires_at);

-- Create function to clean up expired cart items
CREATE OR REPLACE FUNCTION public.cleanup_expired_cart_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.cart_items
  WHERE expires_at IS NOT NULL 
    AND expires_at < now();
END;
$$;