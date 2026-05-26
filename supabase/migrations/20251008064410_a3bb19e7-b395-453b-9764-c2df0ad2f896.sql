-- Allow everyone to view business settings (especially appointment booking status)
CREATE POLICY "Everyone can view business settings"
ON public.business_settings
FOR SELECT
USING (true);