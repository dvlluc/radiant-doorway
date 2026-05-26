-- Add currency columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS currency_symbol text DEFAULT '$';

-- Add comment
COMMENT ON COLUMN public.services.currency_code IS 'Currency code based on business location (e.g., USD, EUR, GBP)';
COMMENT ON COLUMN public.services.currency_symbol IS 'Currency symbol for display (e.g., $, €, £)';