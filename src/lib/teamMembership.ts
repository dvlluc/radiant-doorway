import { supabase } from "@/integrations/supabase/client";

export const ALREADY_TEAM_MEMBER_ERROR = "ALREADY_TEAM_MEMBER";

export const TEAM_MEMBERSHIP_BLOCKED_MESSAGE =
  "You are already a team member at another business. You can accept this invitation only after you are no longer an active team member.";

export async function getActiveTeamMembership(userId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, business_id")
    .eq("member_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function canAcceptTeamInvitation(
  userId: string,
  invitationBusinessId: string
) {
  const activeMembership = await getActiveTeamMembership(userId);

  if (!activeMembership) {
    return { canAccept: true as const };
  }

  if (activeMembership.business_id === invitationBusinessId) {
    return { canAccept: true as const };
  }

  return { canAccept: false as const };
}

export function isAlreadyTeamMemberError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";
  return message.includes(ALREADY_TEAM_MEMBER_ERROR);
}
