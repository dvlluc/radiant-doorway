-- Add role and invitation_message columns to team_members
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS role text DEFAULT 'staff',
ADD COLUMN IF NOT EXISTS invitation_message text;

-- Add metadata to store additional invitation details in notifications
COMMENT ON COLUMN team_members.role IS 'Role of the team member (e.g., stylist, receptionist, manager)';
COMMENT ON COLUMN team_members.invitation_message IS 'Optional personal message from the business owner';