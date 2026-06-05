-- A professional can only be an active team member of one business at a time.
CREATE OR REPLACE FUNCTION public.enforce_single_team_membership()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'accepted' AND NEW.member_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.member_id = NEW.member_id
        AND tm.status = 'accepted'
        AND tm.id IS DISTINCT FROM NEW.id
    ) THEN
      RAISE EXCEPTION 'ALREADY_TEAM_MEMBER'
        USING ERRCODE = 'P0001',
              HINT = 'Leave your current team before accepting a new invitation.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_team_membership ON public.team_members;

CREATE TRIGGER trg_enforce_single_team_membership
  BEFORE INSERT OR UPDATE OF status, member_id
  ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_team_membership();

CREATE UNIQUE INDEX IF NOT EXISTS team_members_one_active_employment_per_user
  ON public.team_members (member_id)
  WHERE status = 'accepted' AND member_id IS NOT NULL;
