import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TerminateStaffMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    email: string;
  };
  memberName: string;
  onTerminate: () => void;
}

export function TerminateStaffMemberDialog({ 
  open, 
  onOpenChange, 
  member, 
  memberName,
  onTerminate 
}: TerminateStaffMemberDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTerminate = async () => {
    setLoading(true);

    try {
      // Update status to terminated instead of deleting
      const { error } = await supabase
        .from("team_members")
        .update({
          status: "terminated",
        })
        .eq("id", member.id);

      if (error) throw error;

      toast({
        title: "Staff member terminated",
        description: "The staff member has been terminated successfully.",
      });

      onTerminate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error terminating staff member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to terminate staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Terminate Staff Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to terminate "{memberName}"? This will change their status to "Terminated" but preserve their records and booking history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Termination (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add a reason for termination..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTerminate} 
              disabled={loading}
              variant="destructive"
            >
              Terminate Staff Member
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
