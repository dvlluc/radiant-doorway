
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS deposit_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_percentage numeric NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS refund_policy_hours integer NOT NULL DEFAULT 24;

ALTER TABLE public.business_settings
  ADD CONSTRAINT business_settings_deposit_percentage_check
  CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100);

ALTER TABLE public.business_settings
  ADD CONSTRAINT business_settings_refund_hours_check
  CHECK (refund_policy_hours IN (24, 48, 72));
