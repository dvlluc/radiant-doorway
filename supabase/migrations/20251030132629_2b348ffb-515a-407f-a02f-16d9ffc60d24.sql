-- Allow everyone to view basic profile information (avatar and display name)
CREATE POLICY "Anyone can view basic profile info"
ON public.profiles
FOR SELECT
USING (true);