import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Loader2, CheckCircle2, XCircle, Calendar, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay } from "date-fns";

interface Appointment {
  id: string;
  title: string;
  customer_id: string;
  start_time: string;
  end_time: string;
  status: string;
  checked_in_at?: string;
  customer_name?: string;
}

interface CheckInResult {
  valid: boolean;
  message?: string;
  appointment?: {
    start_time: string;
    profiles?: { first_name?: string; last_name?: string };
  };
  canCheckIn?: boolean;
  alreadyCheckedIn?: boolean;
}

export function CheckInSystem() {
  const [selectedAppointment, setSelectedAppointment] = useState<string>("");
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodaysAppointments();
  }, []);

  const fetchTodaysAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      const { data: businessAppointments } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", startOfToday)
        .lte("start_time", endOfToday)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      const { data: staffAppointments } = await supabase
        .from("appointments")
        .select("*")
        .eq("staff_member_id", user.id)
        .gte("start_time", startOfToday)
        .lte("start_time", endOfToday)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      const allAppointments = [
        ...(businessAppointments || []),
        ...(staffAppointments || []),
      ];
      const uniqueAppointments = Array.from(
        new Map(allAppointments.map((apt) => [apt.id, apt])).values()
      );

      const appointmentsWithNames = await Promise.all(
        uniqueAppointments.map(async (apt) => {
          let customerName = "N/A";
          if (apt.customer_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", apt.customer_id)
              .single();

            if (profile) {
              customerName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
            }
          }
          return { ...apt, customer_name: customerName };
        })
      );

      setTodaysAppointments(appointmentsWithNames);
    } catch (error) {
      console.error("Error fetching today's appointments:", error);
    }
  };

  const handleManualCheckIn = async () => {
    if (!selectedAppointment) {
      toast({
        title: "Error",
        description: "Please select an appointment",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setCheckInResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("check-in-appointment", {
        body: { appointmentId: selectedAppointment, checkIn: true },
      });

      if (error) throw error;

      setCheckInResult(data);

      if (data.valid && data.message) {
        toast({
          title: "Success",
          description: data.message,
        });
        setSelectedAppointment("");
        fetchTodaysAppointments();
      } else {
        toast({
          title: "Error",
          description: data.message || "Unable to check in",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to check in client";
      console.error("Error checking in:", error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Client Check-In
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Appointment</label>
          <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an appointment" />
            </SelectTrigger>
            <SelectContent>
              {todaysAppointments.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No appointments scheduled for today
                </div>
              ) : (
                todaysAppointments.map((apt) => (
                  <SelectItem key={apt.id} value={apt.id}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium">{apt.customer_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(apt.start_time), "h:mm a")}
                      </span>
                      {apt.checked_in_at && (
                        <Badge variant="secondary" className="ml-2">
                          Checked In
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleManualCheckIn}
          disabled={loading || !selectedAppointment}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking In...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Check In Client
            </>
          )}
        </Button>

        {todaysAppointments.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Today&apos;s Schedule</h4>
            <div className="space-y-2">
              {todaysAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{format(new Date(apt.start_time), "h:mm a")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{apt.customer_name}</span>
                    {apt.checked_in_at && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {checkInResult && checkInResult.valid && checkInResult.appointment && (
          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-green-900 dark:text-green-100">
                  {checkInResult.message || "Client checked in successfully"}
                </p>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>
                      {checkInResult.appointment.profiles?.first_name}{" "}
                      {checkInResult.appointment.profiles?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(checkInResult.appointment.start_time), "PPp")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {checkInResult && !checkInResult.valid && (
          <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-900 dark:text-red-100">
                {checkInResult.message || "Invalid appointment"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
