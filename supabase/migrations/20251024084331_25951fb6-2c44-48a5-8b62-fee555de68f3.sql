-- Fix security warning: Add search_path to function
-- Drop trigger first, then function, then recreate both
DROP TRIGGER IF EXISTS trigger_generate_appointment_qr ON appointments;
DROP FUNCTION IF EXISTS generate_appointment_qr_code();

CREATE OR REPLACE FUNCTION generate_appointment_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a unique QR code if not already set
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := 'APT-' || UPPER(SUBSTRING(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 12));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Recreate trigger
CREATE TRIGGER trigger_generate_appointment_qr
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION generate_appointment_qr_code();
