import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Calendar, Mail, Clock, Ban, Plus, CheckCircle2, XCircle, UserX, AlertCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { BlockTimeDialog } from "./staff/BlockTimeDialog";
import { format } from "date-fns";
import { MyBookingsPage } from "./MyBookingsPage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckInSystem } from "./CheckInSystem";

interface TeamMembership {
  id: string;
  business_id: string;
  role: string;
  invited_at: string;
  accepted_at: string;
  business_name: string;
  business_email: string;
  business_avatar?: string;
}

interface BlockedTime {
  id: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_at: string;
}

interface AppointmentStatus {
  status: string;
  count: number;
  appointments: any[];
}

export function TeamMemberPage() {
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [blockTimeOpen, setBlockTimeOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [statusData, setStatusData] = useState<AppointmentStatus[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    loadTeamMemberships();
    loadBlockedTimes();
  }, []);

  const loadTeamMemberships = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all accepted team memberships for this user
      const { data: teamData, error: teamError } = await supabase
        .from("team_members")
        .select("*")
        .eq("member_id", user.id)
        .eq("status", "accepted");

      if (teamError) throw teamError;

      if (teamData && teamData.length > 0) {
        // Fetch business details for each membership
        const businessIds = teamData.map((t) => t.business_id);
        const { data: businessData, error: businessError } = await supabase
          .from("business_profiles")
          .select("user_id, business_name, email, avatar_url")
          .in("user_id", businessIds);

        if (businessError) throw businessError;

        // Combine team membership with business details
        const membershipsWithDetails = teamData.map((team) => {
          const business = businessData?.find((b) => b.user_id === team.business_id);
          return {
            id: team.id,
            business_id: team.business_id,
            role: team.role || "staff",
            invited_at: team.invited_at,
            accepted_at: team.accepted_at,
            business_name: business?.business_name || "Unknown Business",
            business_email: business?.email || "",
            business_avatar: business?.avatar_url,
          };
        });

        setMemberships(membershipsWithDetails);
      }
    } catch (error) {
      console.error("Error loading team memberships:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedTimes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("blocked_time")
        .select("*")
        .eq("staff_member_id", user.id)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setBlockedTimes(data || []);
    } catch (error) {
      console.error("Error loading blocked times:", error);
    }
  };

  const handleDeleteBlockedTime = async (id: string) => {
    try {
      const { error } = await supabase
        .from("blocked_time")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadBlockedTimes();
    } catch (error) {
      console.error("Error deleting blocked time:", error);
    }
  };

  const loadBookingStatus = async () => {
    try {
      setLoadingStatus(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch appointments for this staff member
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("staff_member_id", user.id)
        .order("start_time", { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Fetch customer names for appointments
      const appointmentsWithNames = await Promise.all(
        (appointments || []).map(async (apt) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", apt.customer_id)
            .single();
          return { ...apt, profiles: profile };
        })
      );

      // Fetch waiting list entries
      const { data: waitingList, error: waitingError } = await supabase
        .from("waiting_list")
        .select("*")
        .eq("staff_member_id", user.id)
        .order("created_at", { ascending: false });

      if (waitingError) throw waitingError;

      // Fetch customer names for waiting list
      const waitingWithNames = await Promise.all(
        (waitingList || []).map(async (wait) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", wait.customer_id)
            .single();
          return { ...wait, profiles: profile };
        })
      );

      // Group by status
      const statuses = ['scheduled', 'completed', 'cancelled', 'no_show', 'arrived'];
      const statusGroups: AppointmentStatus[] = statuses.map(status => ({
        status,
        count: appointmentsWithNames?.filter((a: any) => a.status === status).length || 0,
        appointments: appointmentsWithNames?.filter((a: any) => a.status === status) || []
      }));

      // Add waiting list as a separate status
      statusGroups.push({
        status: 'waiting',
        count: waitingWithNames?.length || 0,
        appointments: waitingWithNames as any[] || []
      });

      setStatusData(statusGroups);
    } catch (error) {
      console.error("Error loading booking status:", error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'arrived':
        return <Clock className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      case 'no_show':
        return <UserX className="w-5 h-5" />;
      case 'waiting':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600';
      case 'arrived':
        return 'text-purple-600';
      case 'completed':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      case 'no_show':
        return 'text-orange-600';
      case 'waiting':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Building2 className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Team Memberships</h3>
          <p className="text-muted-foreground">
            You haven't accepted any team invitations yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CheckInSystem />

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          You are a team member of {memberships.length} {memberships.length === 1 ? "business" : "businesses"}
        </p>
      </div>

      <Tabs defaultValue="businesses" className="w-full" onValueChange={(value) => {
        if (value === 'booking-status') {
          loadBookingStatus();
        }
      }}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="businesses" className="text-xs sm:text-sm py-2">My Businesses</TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs sm:text-sm py-2">My Calendar</TabsTrigger>
          <TabsTrigger value="booking-status" className="text-xs sm:text-sm py-2">Booking Status</TabsTrigger>
          <TabsTrigger value="blocked-time" className="text-xs sm:text-sm py-2">Blocked Time</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses" className="space-y-4">
          <div className="grid gap-4">
            {memberships.map((membership) => (
              <Card key={membership.id}>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
                      <AvatarImage src={membership.business_avatar} />
                      <AvatarFallback className="bg-muted text-foreground text-base sm:text-lg">
                        {membership.business_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base sm:text-xl mb-1 truncate">
                            {membership.business_name}
                          </CardTitle>
                          <Badge variant="secondary" className="capitalize text-xs">
                            {membership.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <div className="grid gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{membership.business_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>
                        Joined on {new Date(membership.accepted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <MyBookingsPage viewType="staff" />
        </TabsContent>

        <TabsContent value="booking-status" className="space-y-4">
          {loadingStatus ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              {statusData.map((statusGroup) => (
                <Card key={statusGroup.status}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={getStatusColor(statusGroup.status)}>
                          {getStatusIcon(statusGroup.status)}
                        </div>
                        <CardTitle className="text-lg capitalize">
                          {statusGroup.status === 'no_show' ? 'No Show' : statusGroup.status}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-lg px-3">
                        {statusGroup.count}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {statusGroup.count > 0 ? (
                      <div className="space-y-2">
                        {statusGroup.appointments.slice(0, 3).map((appointment) => (
                          <Alert key={appointment.id}>
                            <AlertDescription className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(appointment.start_time || appointment.requested_date), "PPp")}
                                </p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                        {statusGroup.count > 3 && (
                          <p className="text-sm text-muted-foreground text-center pt-2">
                            + {statusGroup.count - 3} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No {statusGroup.status} appointments
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="blocked-time" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (memberships.length > 0) {
                  setSelectedBusiness(memberships[0].business_id);
                  setBlockTimeOpen(true);
                }
              }}
              disabled={memberships.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Block Time
            </Button>
          </div>

          <div className="grid gap-4">
            {blockedTimes.length > 0 ? (
              blockedTimes.map((blockedTime) => (
                <Card key={blockedTime.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-destructive flex-shrink-0" />
                          <h4 className="font-semibold text-sm sm:text-base">Blocked Time</h4>
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                            <span className="break-words">
                              {format(new Date(blockedTime.start_time), "PPp")} -{" "}
                              {format(new Date(blockedTime.end_time), "p")}
                            </span>
                          </div>
                          {blockedTime.reason && (
                            <p className="mt-2 break-words">Reason: {blockedTime.reason}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="self-end sm:self-start text-xs sm:text-sm"
                        onClick={() => handleDeleteBlockedTime(blockedTime.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Ban className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Blocked Time</h3>
                  <p className="text-muted-foreground">
                    You haven't blocked any time slots yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedBusiness && (
        <BlockTimeDialog
          open={blockTimeOpen}
          onOpenChange={setBlockTimeOpen}
          businessId={selectedBusiness}
          onUpdate={loadBlockedTimes}
        />
      )}
    </div>
  );
}
