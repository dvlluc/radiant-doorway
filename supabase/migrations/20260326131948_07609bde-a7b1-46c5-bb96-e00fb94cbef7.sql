
-- Allow everyone to read user_roles (account_type is not sensitive)
CREATE POLICY "Anyone can view user roles"
  ON public.user_roles FOR SELECT
  TO public
  USING (true);
