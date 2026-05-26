import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X } from "lucide-react";

interface TeamInvitationActionsProps {
  invitationId: string;
  onAction: () => void;
}

export function TeamInvitationActions({ invitationId, onAction }: TeamInvitationActionsProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to accept invitations",
          variant: "destructive",
        });
        return;
      }

      // Update team member status
      const { error: updateError } = await supabase
        .from("team_members")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          member_id: user.id,
        })
        .eq("id", invitationId);

      if (updateError) throw updateError;

      toast({
        title: "Invitation accepted",
        description: "You are now part of the team!",
      });

      // Dispatch custom event to notify Account page to refresh
      window.dispatchEvent(new CustomEvent('teamMembershipChanged'));

      onAction();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      // Delete the invitation
      const { error: deleteError } = await supabase
        .from("team_members")
        .delete()
        .eq("id", invitationId);

      if (deleteError) throw deleteError;

      toast({
        title: "Invitation rejected",
        description: "The invitation has been declined.",
      });

      onAction();
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      toast({
        title: "Error",
        description: "Failed to reject invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <Button
        size="sm"
        onClick={handleAccept}
        disabled={loading}
        className="flex-1"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Check className="mr-1 h-4 w-4" />
            Accept
          </>
        )}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={loading}
        className="flex-1"
      >
        <X className="mr-1 h-4 w-4" />
        Reject
      </Button>
    </div>
  );
}
