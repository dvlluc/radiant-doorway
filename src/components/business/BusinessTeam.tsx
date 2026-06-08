import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Plus, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InviteProfessionalDialog } from "./InviteProfessionalDialog";
import { EditStaffMemberDialog } from "./EditStaffMemberDialog";
import { TerminateStaffMemberDialog } from "./TerminateStaffMemberDialog";

interface TeamMember {
  id: string;
  email: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  member_id: string | null;
  role: string;
  invitation_message: string | null;
  title?: string;
  phone?: string;
  specialties?: string;
  bio?: string;
  member_name?: string;
  member_avatar?: string;
}

export const BusinessTeam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [terminateMember, setTerminateMember] = useState<TeamMember | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const getActiveMembers = () => {
    return members.filter(m => m.status !== "terminated");
  };

  const getMemberPosition = (member: TeamMember) => {
    const rawPosition = member.title?.trim() || member.role?.trim() || "";

    if (!rawPosition) return "";

    return rawPosition
      .split(" ")
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleInviteClick = async () => {
    const activeMembers = getActiveMembers();
    
    // First staff member is free
    if (activeMembers.length < 1) {
      setDialogOpen(true);
      return;
    }

    // Check subscription for additional members
    setCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-booking-subscription");
      if (error) throw error;

      if (data?.subscribed) {
        setDialogOpen(true);
      } else {
        setUpgradeDialogOpen(true);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      toast({
        title: "Error",
        description: "Could not verify subscription status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckingSubscription(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teamData, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("business_id", user.id)
        .order("invited_at", { ascending: false });

      if (error) throw error;

      // Fetch profile information for all members who have a member_id or email
      const membersWithProfiles = await Promise.all(
        (teamData || []).map(async (member) => {
          // Try to get profile by member_id first
          if (member.member_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, avatar_url")
              .eq("id", member.member_id)
              .maybeSingle();

            if (profile) {
              return {
                ...member,
                member_id: profile.id,
                member_name: profile.first_name || member.email,
                member_avatar: profile.avatar_url,
              };
            }
          }
          
          // If no member_id or profile not found, try to look up by email
          if (member.email) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, avatar_url")
              .eq("email", member.email)
              .maybeSingle();

            if (profile) {
              return {
                ...member,
                member_id: profile.id,
                member_name: profile.first_name || member.email,
                member_avatar: profile.avatar_url,
              };
            }
          }
          
          return member;
        })
      );

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error loading team members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (email: string, role: string, message: string, bio: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get business profile for notification
      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("business_name")
        .eq("user_id", user.id)
        .single();

      const businessName = businessProfile?.business_name || "A business";

      // Find user by email
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("email", email)
        .limit(1);

      if (!profiles || profiles.length === 0) {
        toast({
          title: "User not found",
          description: "No user with this email address exists on the platform.",
          variant: "destructive",
        });
        return;
      }

      const targetUser = profiles[0];

      // Create team member invitation
      const { data: invitation, error: inviteError } = await supabase
        .from("team_members")
        .insert({
          business_id: user.id,
          member_id: targetUser.id,
          email: email,
          role: role,
          invitation_message: message || null,
          bio: bio || null,
          status: "pending",
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Create notification for the invited user
      const notificationMessage = message 
        ? `${businessName} has invited you to join their team as a ${role}. Message: "${message}"`
        : `${businessName} has invited you to join their team as a ${role}.`;

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: targetUser.id,
          type: "team_invitation",
          title: "Team Invitation",
          message: notificationMessage,
          read: false,
          action_url: JSON.stringify({ 
            type: "team_invitation", 
            invitation_id: invitation.id 
          }),
        });

      if (notificationError) throw notificationError;

      await loadTeamMembers();
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${targetUser.first_name || 'the user'}`,
      });
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadTeamMembers();
      toast({
        title: "Member removed",
        description: "The team member has been removed successfully.",
      });
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold">Team Management</h3>
        </div>
        <Button onClick={handleInviteClick} size="sm" className="w-full sm:w-auto" disabled={checkingSubscription}>
          {checkingSubscription ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Invite Professional
        </Button>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground">
        Invite team members to collaborate. They can manage their own appointments and schedules.
      </p>

      <InviteProfessionalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onInvite={handleInvite}
      />

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Upgrade Required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your free plan includes <strong>1 staff member</strong>. To add more team members, please upgrade to a paid subscription.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setUpgradeDialogOpen(false);
                window.open("/account?tab=subscriptions", "_self");
              }}>
                <Crown className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {editMember && (
        <EditStaffMemberDialog
          open={!!editMember}
          onOpenChange={(open) => !open && setEditMember(null)}
          member={editMember}
          onUpdate={loadTeamMembers}
        />
      )}

      {terminateMember && (
        <TerminateStaffMemberDialog
          open={!!terminateMember}
          onOpenChange={(open) => !open && setTerminateMember(null)}
          member={terminateMember}
          memberName={terminateMember.member_name || terminateMember.email}
          onTerminate={loadTeamMembers}
        />
      )}

      <div className="space-y-4">
        {members.map(member => (
          <Card
            key={member.id}
            className={member.member_id ? "cursor-pointer hover:shadow-md transition-shadow" : undefined}
            onClick={() => {
              if (member.member_id) {
                navigate(`/professional/${member.member_id}`);
              }
            }}
          >
            <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <Avatar className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                  <AvatarImage src={member.member_avatar} />
                  <AvatarFallback className="bg-muted text-foreground text-base sm:text-lg">
                    {member.member_name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-semibold text-base sm:text-lg truncate">
                          {member.member_name || member.email}
                        </h4>
                        {getMemberPosition(member) && (
                          <>
                            <div className="h-4 w-px bg-border shrink-0" />
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {getMemberPosition(member)}
                            </p>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        {member.member_id ? "BeautyConnect Account" : "No BeautyConnect Account"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      {member.status === "pending" && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">Pending</Badge>
                      )}
                      {member.status === "accepted" && (
                        <Badge variant="default" className="text-[10px] sm:text-xs">Active</Badge>
                      )}
                      {member.status === "terminated" && (
                        <Badge variant="destructive" className="text-[10px] sm:text-xs">Terminated</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditMember(member);
                        }}
                      >
                        Edit
                      </Button>
                      {member.status !== "terminated" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTerminateMember(member);
                          }}
                        >
                          Terminate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-[10px] sm:text-sm">Bookings</p>
                  <p className="font-medium truncate">- this month</p>
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-[10px] sm:text-sm">Rating</p>
                  <p className="font-medium">-/5</p>
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-[10px] sm:text-sm">Specialties</p>
                  <p className="font-medium truncate">{member.specialties || "-"}</p>
                </div>
              </div>
              {member.bio && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">{member.bio}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {members.length === 0 && (
          <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No team members yet</p>
          </div>
        )}
      </div>
    </div>
  );
};