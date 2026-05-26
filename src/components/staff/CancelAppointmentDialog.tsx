import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    title: string;
  };
  onUpdate: () => void;
}

export function CancelAppointmentDialog({ 
  open, 
  onOpenChange, 
  appointment,
  onUpdate 
}: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    setLoading(true);

    try {
      // Get appointment details before cancelling
      const { data: aptData } = await supabase
        .from("appointments")
        .select("user_id, staff_member_id, start_time")
        .eq("id", appointment.id)
        .single();

      if (!aptData) throw new Error("Appointment not found");

      // Cancel the appointment
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled",
          description: reason ? `Cancelled: ${reason}` : "Cancelled by staff",
        })
        .eq("id", appointment.id);

      if (error) throw error;

      // Get business name for promotion
      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("business_name")
        .eq("user_id", aptData.user_id)
        .single();

      // Extract date and time from start_time
      const startDate = new Date(aptData.start_time);
      const date = startDate.toISOString().split('T')[0];
      const hours = startDate.getHours();
      const minutes = startDate.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const time = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

      // Try to promote someone from waiting list
      try {
        await supabase.functions.invoke('promote-waiting-list', {
          body: {
            cancelled_appointment_id: appointment.id,
            business_id: aptData.user_id,
            staff_member_id: aptData.staff_member_id,
            date: date,
            time: time,
            business_name: businessProfile?.business_name || 'Business'
          }
        });
      } catch (promoteError) {
        console.error("Error promoting waiting list:", promoteError);
        // Don't fail the cancellation if promotion fails
      }

      toast({
        title: "Appointment cancelled",
        description: "The appointment has been successfully cancelled.",
      });

      onUpdate();
      onOpenChange(false);
      setReason("");
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment. Please try again.",
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
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel "{appointment.title}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a reason for cancellation..."
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
              Go Back
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancel} 
              disabled={loading}
            >
              Cancel Appointment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
