-- Allow everyone to view accepted team members (needed for booking page)
CREATE POLICY "Anyone can view accepted team members"
ON public.team_members
FOR SELECT
TO public
USING (status = 'accepted');