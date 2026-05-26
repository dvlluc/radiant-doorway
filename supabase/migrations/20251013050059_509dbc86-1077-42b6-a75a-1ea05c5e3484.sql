-- Add discount fields to services table
ALTER TABLE public.services
ADD COLUMN discount_percentage numeric CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
ADD COLUMN original_price numeric,
ADD COLUMN discount_active boolean DEFAULT false;

-- Add comment explaining the discount fields
COMMENT ON COLUMN public.services.discount_percentage IS 'Percentage discount on the service (0-100)';
COMMENT ON COLUMN public.services.original_price IS 'Original price before discount, stored when discount is applied';
COMMENT ON COLUMN public.services.discount_active IS 'Whether the discount is currently active';