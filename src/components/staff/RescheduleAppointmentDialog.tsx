import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RescheduleAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
  };
  onUpdate: () => void;
}

export function RescheduleAppointmentDialog({ 
  open, 
  onOpenChange, 
  appointment,
  onUpdate 
}: RescheduleAppointmentDialogProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReschedule = async () => {
    if (!startTime || !endTime) {
      toast({
        title: "Missing information",
        description: "Please provide both start and end times.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          start_time: startTime,
          end_time: endTime,
        })
        .eq("id", appointment.id);

      if (error) throw error;

      toast({
        title: "Appointment rescheduled",
        description: "The appointment has been successfully rescheduled.",
      });

      onUpdate();
      onOpenChange(false);
      setStartTime("");
      setEndTime("");
    } catch (error: any) {
      console.error("Error rescheduling appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule appointment. Please try again.",
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
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Update the appointment time for "{appointment.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-time">Start Time</Label>
            <Input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-time">End Time</Label>
            <Input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
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
            <Button onClick={handleReschedule} disabled={loading}>
              Reschedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
