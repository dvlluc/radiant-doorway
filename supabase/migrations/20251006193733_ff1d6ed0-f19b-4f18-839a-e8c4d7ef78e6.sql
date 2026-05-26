-- Fix team_members RLS policies to use profiles instead of auth.users
DROP POLICY IF EXISTS "Team members can update their status" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view their invitations" ON public.team_members;

-- Create updated policies that use profiles table
CREATE POLICY "Team members can update their status" 
ON public.team_members
FOR UPDATE
USING (
  (auth.uid() = member_id) OR 
  (email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
)
WITH CHECK (
  (auth.uid() = member_id) OR 
  (email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Team members can view their invitations" 
ON public.team_members
FOR SELECT
USING (
  (auth.uid() = member_id) OR 
  (email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
);