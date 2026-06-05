import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  cancelAppointmentAsCustomer,
  cancelAppointmentAsStaff,
  promoteWaitingListAfterCancellation,
} from "@/lib/booking/cancelAppointment";

interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    title: string;
  };
  onUpdate: () => void;
  cancelledBy?: "staff" | "customer";
}

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onUpdate,
  cancelledBy = "staff",
}: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isCustomerCancellation = cancelledBy === "customer";

  const handleCancel = async () => {
    setLoading(true);

    try {
      if (isCustomerCancellation) {
        await cancelAppointmentAsCustomer(appointment.id, reason);
      } else {
        await cancelAppointmentAsStaff(appointment.id, reason);
      }

      try {
        await promoteWaitingListAfterCancellation(appointment.id);
      } catch (promoteError) {
        console.error("Error promoting waiting list:", promoteError);
      }

      toast({
        title: "Appointment cancelled",
        description: isCustomerCancellation
          ? "Your booking has been cancelled."
          : "The appointment has been successfully cancelled.",
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
            {isCustomerCancellation
              ? `Are you sure you want to cancel your booking for "${appointment.title}"? Refund eligibility depends on the business cancellation policy.`
              : `Are you sure you want to cancel "${appointment.title}"? This action cannot be undone.`}
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
            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
              Cancel Appointment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
