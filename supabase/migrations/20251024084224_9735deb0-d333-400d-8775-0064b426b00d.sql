-- Add check-in related columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES auth.users(id);

-- Create index for faster QR code lookups
CREATE INDEX IF NOT EXISTS idx_appointments_qr_code ON appointments(qr_code);

-- Create function to generate QR code for appointments
CREATE OR REPLACE FUNCTION generate_appointment_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a unique QR code if not already set
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := 'APT-' || UPPER(SUBSTRING(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 12));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-generate QR codes
DROP TRIGGER IF EXISTS trigger_generate_appointment_qr ON appointments;
CREATE TRIGGER trigger_generate_appointment_qr
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION generate_appointment_qr_code();
