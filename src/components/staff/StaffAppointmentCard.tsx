import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, X } from "lucide-react";
import { format } from "date-fns";
import { RescheduleAppointmentDialog } from "./RescheduleAppointmentDialog";
import { CancelAppointmentDialog } from "./CancelAppointmentDialog";

interface Appointment {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  service_type?: string;
  status: string;
  description?: string;
}

interface StaffAppointmentCardProps {
  appointment: Appointment;
  onUpdate: () => void;
}

export function StaffAppointmentCard({ appointment, onUpdate }: StaffAppointmentCardProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const startDate = new Date(appointment.start_time);
  const endDate = new Date(appointment.end_time);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-lg">{appointment.title}</h4>
              {appointment.service_type && (
                <p className="text-sm text-muted-foreground">{appointment.service_type}</p>
              )}
            </div>
            <Badge variant={appointment.status === "scheduled" ? "default" : "secondary"}>
              {appointment.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{format(startDate, "EEEE, MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}</span>
          </div>
          {appointment.customer_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{appointment.customer_name}</span>
            </div>
          )}
          {appointment.description && (
            <p className="text-sm text-muted-foreground mt-2">{appointment.description}</p>
          )}
          
          {appointment.status === "scheduled" && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRescheduleOpen(true)}
              >
                Reschedule
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setCancelOpen(true)}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <RescheduleAppointmentDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        appointment={appointment}
        onUpdate={onUpdate}
      />

      <CancelAppointmentDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        appointment={appointment}
        onUpdate={onUpdate}
      />
    </>
  );
}
