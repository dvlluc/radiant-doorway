import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  customer_id: string;
  staff_member_id: string;
  created_at: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  staff: {
    first_name: string;
    last_name: string;
  };
}

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      let query = supabase
        .from("appointments")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch customer and staff details
      const bookingsWithDetails = await Promise.all(
        (data || []).map(async (booking) => {
          const [customerData, staffData] = await Promise.all([
            supabase
              .from("profiles")
              .select("first_name, last_name, email")
              .eq("id", booking.customer_id)
              .single(),
            supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", booking.staff_member_id)
              .single(),
          ]);

          return {
            ...booking,
            customer: customerData.data || { first_name: "", last_name: "", email: "" },
            staff: staffData.data || { first_name: "", last_name: "" },
          };
        })
      );

      setBookings(bookingsWithDetails);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success(`Booking ${newStatus}`);
      fetchBookings();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "default";
      case "confirmed":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Management</CardTitle>
        <CardDescription>View and manage all appointments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "scheduled" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("scheduled")}
            >
              Scheduled
            </Button>
            <Button
              variant={filter === "confirmed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("confirmed")}
            >
              Confirmed
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("completed")}
            >
              Completed
            </Button>
            <Button
              variant={filter === "cancelled" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("cancelled")}
            >
              Cancelled
            </Button>
          </div>

          {loading ? (
            <div>Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <p className="text-muted-foreground">No bookings found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.title}</TableCell>
                      <TableCell>
                        <div>
                          <div>
                            {booking.customer.first_name} {booking.customer.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {booking.customer.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.staff.first_name} {booking.staff.last_name}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{new Date(booking.start_time).toLocaleDateString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(booking.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(booking.status)}>{booking.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {booking.status === "scheduled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, "confirmed")}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {booking.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, "cancelled")}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
