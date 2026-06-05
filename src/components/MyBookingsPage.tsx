import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, MoreHorizontal, X, CheckCircle2, XCircle, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CancelAppointmentDialog } from "./staff/CancelAppointmentDialog";
import { RescheduleAppointmentDialog } from "./staff/RescheduleAppointmentDialog";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { CheckInSystem } from "./CheckInSystem";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { isAppointmentCancellable } from "@/lib/booking/cancelAppointment";

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  service_type: string | null;
  start_time: string;
  end_time: string;
  status: string;
  color: string | null;
  customer_id: string | null;
  staff_member_id: string | null;
  customer_name?: string;
  staff_name?: string;
}

interface WaitingListEntry {
  id: string;
  business_id: string;
  staff_member_id: string;
  customer_id: string;
  requested_date: string;
  requested_time: string;
  services: any[];
  special_requests: string | null;
  status: string;
  created_at: string;
  customer_name?: string;
  staff_name?: string;
}

interface BusinessHour {
  day_of_week: string;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  display_name: string | null;
}

interface MyBookingsPageProps {
  viewType?: 'customer' | 'business' | 'staff';
}

export function MyBookingsPage({ viewType = 'customer' }: MyBookingsPageProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "agenda" | "staff">("month");
  const [activeTab, setActiveTab] = useState<"calendar" | "list" | "status">("calendar");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "cancelled" | "no-show" | "refunded" | "rescheduled" | "completed" | "waiting">("all");
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
    fetchWaitingList();
    if (viewType === 'business') {
      fetchBusinessHours();
      fetchStaffMembers();
    }
  }, [viewType]);

  // Reset to calendar view if viewing status but not a business
  useEffect(() => {
    if (activeTab === 'status' && viewType !== 'business') {
      setActiveTab('calendar');
    }
  }, [viewType, activeTab]);

  const fetchBusinessHours = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setBusinessHours(data || []);
    } catch (error) {
      console.error("Error fetching business hours:", error);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("[MyBookingsPage] Fetching staff members for business:", user.id);

      const { data, error } = await supabase
        .from("team_members")
        .select("member_id")
        .eq("business_id", user.id)
        .not("member_id", "is", null);

      if (error) {
        console.error("[MyBookingsPage] Error fetching team members:", error);
        throw error;
      }

      console.log("[MyBookingsPage] Team members data:", data);

      if (data && data.length > 0) {
        const staffIds = data.map(member => member.member_id).filter(Boolean);
        console.log("[MyBookingsPage] Staff IDs:", staffIds);
        
        if (staffIds.length > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from("public_profiles")
            .select("id, username, avatar_url, display_name")
            .in("id", staffIds);

          if (profileError) {
            console.error("[MyBookingsPage] Error fetching profiles:", profileError);
            throw profileError;
          }
          
          console.log("[MyBookingsPage] Staff profiles loaded:", profiles);
          
          // Map public_profiles to StaffMember format
          const staffData: StaffMember[] = (profiles || []).map(p => ({
            id: p.id,
            first_name: p.display_name?.split(' ')[0] || p.username || '',
            last_name: p.display_name?.split(' ')[1] || '',
            avatar_url: p.avatar_url,
            display_name: p.display_name || p.username || null
          }));
          
          setStaffMembers(staffData);
        }
      } else {
        console.log("[MyBookingsPage] No team members found");
      }
    } catch (error) {
      console.error("[MyBookingsPage] Error in fetchStaffMembers:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Build query based on view type
      let query = supabase.from("appointments").select("*");
      
      if (viewType === 'business') {
        // Business view: show appointments where user_id (business owner) matches
        query = query.eq('user_id', user.id);
      } else if (viewType === 'staff') {
        // Staff view: show appointments where staff_member_id matches
        query = query.eq('staff_member_id', user.id);
      } else {
        // Customer view: show appointments where customer_id matches
        query = query.eq('customer_id', user.id);
      }
      
      const { data, error } = await query.order("start_time", { ascending: true });

      if (error) throw error;
      
      // Fetch customer and staff member names
      const appointmentsWithNames = await Promise.all(
        (data || []).map(async (apt) => {
          let customerName = "N/A";
          let staffName = "N/A";

          if (apt.customer_id) {
            const { data: customerProfile } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", apt.customer_id)
              .single();
            
            if (customerProfile) {
              const lastInitial = customerProfile.last_name?.charAt(0) || "";
              customerName = `${customerProfile.first_name || ""} ${lastInitial}.`.trim();
            }
          }

          if (apt.staff_member_id) {
            const { data: staffProfile } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", apt.staff_member_id)
              .single();
            
            if (staffProfile) {
              staffName = staffProfile.first_name || "Staff";
            }
          }

          return {
            ...apt,
            customer_name: customerName,
            staff_name: staffName,
          };
        })
      );

      setAppointments(appointmentsWithNames);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitingList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase.from("waiting_list").select("*");
      
      if (viewType === 'business') {
        query = query.eq('business_id', user.id);
      } else if (viewType === 'staff') {
        query = query.eq('staff_member_id', user.id);
      } else {
        query = query.eq('customer_id', user.id);
      }
      
      const { data, error } = await query
        .eq('status', 'active')
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Fetch customer and staff member names
      const waitingWithNames = await Promise.all(
        (data || []).map(async (entry) => {
          let customerName = "N/A";
          let staffName = "N/A";

          if (entry.customer_id) {
            const { data: customerProfile } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", entry.customer_id)
              .single();
            
            if (customerProfile) {
              const lastInitial = customerProfile.last_name?.charAt(0) || "";
              customerName = `${customerProfile.first_name || ""} ${lastInitial}.`.trim();
            }
          }

          if (entry.staff_member_id) {
            const { data: staffProfile } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", entry.staff_member_id)
              .single();
            
            if (staffProfile) {
              staffName = staffProfile.first_name || "Staff";
            }
          }

          return {
            ...entry,
            services: entry.services as any[],
            customer_name: customerName,
            staff_name: staffName,
          };
        })
      );

      setWaitingList(waitingWithNames);
    } catch (error) {
      console.error("Error fetching waiting list:", error);
    }
  };

  const handlePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewMode === "day") {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.start_time), day)
    );
  };

  const isDayClosed = (date: Date): boolean => {
    if (viewType !== 'business' || businessHours.length === 0) return false;
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    const dayHours = businessHours.find(h => h.day_of_week === dayName);
    
    return !dayHours?.is_open;
  };

  const parseTime = (timeStr: string): { hours: number; minutes: number } => {
    if (!timeStr) return { hours: 0, minutes: 0 };
    
    const [time, period] = timeStr.split(' ');
    if (!time) return { hours: 0, minutes: 0 };
    
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period && period.toLowerCase() === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period && period.toLowerCase() === 'am' && hours === 12) {
      hours = 0;
    }
    
    return { hours, minutes: minutes || 0 };
  };

  const isTimeWithinBusinessHours = (hour: number, minute: number = 0): boolean => {
    if (viewType !== 'business' || businessHours.length === 0) return true;
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[currentDate.getDay()];
    const dayHours = businessHours.find(h => h.day_of_week === dayName);
    
    if (!dayHours?.is_open || !dayHours.open_time || !dayHours.close_time) return false;
    
    const openTime = parseTime(dayHours.open_time);
    const closeTime = parseTime(dayHours.close_time);
    
    const currentMinutes = hour * 60 + minute;
    const openMinutes = openTime.hours * 60 + openTime.minutes;
    const closeMinutes = closeTime.hours * 60 + closeTime.minutes;
    
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  };

  const getTimeSlotRange = (date: Date, weekAppointments?: Appointment[]): { startHour: number; endHour: number } => {
    // Default to full day if not a business view or no business hours
    if (viewType !== 'business' || businessHours.length === 0) {
      return { startHour: 0, endHour: 24 };
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    const dayHours = businessHours.find(h => h.day_of_week === dayName);

    // If closed or no hours, show minimal range
    if (!dayHours?.is_open || !dayHours.open_time || !dayHours.close_time) {
      return { startHour: 9, endHour: 17 };
    }

    const openTime = parseTime(dayHours.open_time);
    const closeTime = parseTime(dayHours.close_time);

    let startHour = openTime.hours;
    let endHour = closeTime.hours + (closeTime.minutes > 0 ? 1 : 0);

    // Check if any appointments fall outside business hours
    const relevantAppointments = weekAppointments || appointments.filter(apt => isSameDay(new Date(apt.start_time), date));
    
    relevantAppointments.forEach(apt => {
      const aptStart = new Date(apt.start_time);
      const aptEnd = new Date(apt.end_time);
      const aptStartHour = aptStart.getHours();
      const aptEndHour = aptEnd.getHours() + (aptEnd.getMinutes() > 0 ? 1 : 0);

      if (aptStartHour < startHour) startHour = aptStartHour;
      if (aptEndHour > endHour) endHour = aptEndHour;
    });

    return { startHour, endHour };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-emerald-500";
      case "pending":
        return "bg-orange-500";
      case "completed":
        return "bg-gray-500";
      case "scheduled":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      case "no-show":
        return "bg-amber-600";
      case "refunded":
        return "bg-purple-500";
      case "rescheduled":
        return "bg-cyan-500";
      case "waiting":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case "scheduled":
      case "confirmed":
        return "default";
      case "cancelled":
      case "no-show":
        return "destructive";
      case "completed":
        return "secondary";
      case "waiting":
        return "outline";
      default:
        return "outline";
    }
  };

  const filterAppointmentsByStatus = (filter: string) => {
    if (filter === "all") return appointments;
    if (filter === "waiting") return [];
    return appointments.filter(apt => apt.status.toLowerCase() === filter);
  };

  const getStatusCount = (status: string) => {
    if (status === "all") return appointments.length + waitingList.length;
    if (status === "waiting") return waitingList.length;
    return appointments.filter(apt => apt.status.toLowerCase() === status).length;
  };

  const getWaitingListForStatus = () => {
    return waitingList;
  };

  const { toast } = useToast();

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Appointment marked as ${newStatus}.`,
      });

      fetchAppointments();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="border rounded-lg overflow-x-auto">
        <div className="grid grid-cols-7 border-b bg-muted min-w-[500px]">
          {weekDays.map((day) => (
            <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-w-[500px]">
          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isClosed = isDayClosed(day);
            
            return (
              <div
                key={index}
                className={`min-h-[80px] sm:min-h-[120px] border-r border-b last:border-r-0 p-1 sm:p-2 ${
                  !isCurrentMonth ? "bg-muted/30" : ""
                } ${isClosed ? "bg-red-50 dark:bg-red-950/20" : ""}`}
              >
                <div className={`text-xs sm:text-sm mb-1 flex items-center justify-between ${!isCurrentMonth ? "text-muted-foreground" : ""}`}>
                  <span>{format(day, "dd")}</span>
                  {isClosed && <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-400">Closed</span>}
                </div>
                <div className="space-y-1">
                  {dayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className={`${getStatusColor(apt.status)} text-white text-xs p-1 rounded truncate cursor-pointer hover:opacity-90`}
                      title={`${apt.title} - ${apt.status}`}
                    >
                      {apt.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Get all appointments for the week
    const weekAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate >= weekStart && aptDate <= weekEnd;
    });
    
    // Calculate the time range based on business hours and appointments
    let minStartHour = 24;
    let maxEndHour = 0;
    
    days.forEach(day => {
      const range = getTimeSlotRange(day, weekAppointments);
      if (range.startHour < minStartHour) minStartHour = range.startHour;
      if (range.endHour > maxEndHour) maxEndHour = range.endHour;
    });
    
    // Generate 15-minute intervals only for the calculated range
    const totalSlots = (maxEndHour - minStartHour) * 4;
    const timeSlots = Array.from({ length: totalSlots }, (_, i) => {
      const totalMinutes = minStartHour * 60 + i * 15;
      return {
        hour: Math.floor(totalMinutes / 60),
        minute: totalMinutes % 60
      };
    });

    return (
      <div className="border rounded-lg overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="grid border-b bg-muted" style={{ gridTemplateColumns: '50px repeat(7, minmax(60px, 1fr))' }}>
            <div className="p-1 sm:p-3 border-r"></div>
            {weekDays.map((day, idx) => (
              <div key={day} className="p-1 sm:p-3 text-center border-r last:border-r-0">
                <div className="font-semibold text-[10px] sm:text-sm">{day}</div>
                <div className="text-[10px] sm:text-sm text-muted-foreground">{format(days[idx], "MMM d")}</div>
              </div>
            ))}
          </div>
          <div className="max-h-[400px] sm:max-h-[600px] overflow-y-auto relative">
            {timeSlots.map((slot, slotIndex) => {
              const isOutsideHours = !isTimeWithinBusinessHours(slot.hour, slot.minute);
              
              // Format time label: full time on the hour, just minutes for 15, 30, 45
              const getTimeLabel = () => {
                if (slot.minute === 0) {
                  return format(new Date().setHours(slot.hour, 0, 0, 0), "h a");
                } else {
                  return slot.minute.toString();
                }
              };
              
              return (
                <div key={slotIndex} className="grid border-b" style={{ gridTemplateColumns: '50px repeat(7, minmax(60px, 1fr))', minHeight: '35px' }}>
                  <div className={`px-1 pt-1 border-r text-[10px] sm:text-xs text-muted-foreground ${isOutsideHours ? 'bg-red-50 dark:bg-red-950/20' : 'bg-muted/30'}`}>
                    {getTimeLabel()}
                  </div>
                  {days.map((day, dayIndex) => {
                    const isClosed = isDayClosed(day);
                    // Only render appointments that START in this exact time slot
                    const slotAppointments = appointments.filter(apt => {
                      const aptDate = new Date(apt.start_time);
                      const aptHour = aptDate.getHours();
                      const aptMinute = aptDate.getMinutes();
                      const slotMinutes = slot.hour * 60 + slot.minute;
                      const aptMinutes = aptHour * 60 + aptMinute;
                      return isSameDay(aptDate, day) && aptMinutes === slotMinutes;
                    });

                    return (
                      <div 
                        key={dayIndex} 
                        className={`border-r last:border-r-0 relative ${
                          (isClosed || isOutsideHours) ? 'bg-red-50/50 dark:bg-red-950/10' : ''
                        }`}
                      >
                        {slotAppointments.map((apt) => {
                          // Calculate duration in minutes
                          const startTime = new Date(apt.start_time);
                          const endTime = new Date(apt.end_time);
                          const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                          const slots = durationMinutes / 15; // Exact slots (can be fractional)
                          const heightInPx = slots * 35 - 1; // 35px per slot on mobile, -1px for border
                          
                          // Extract first name only
                          const firstName = apt.customer_name?.split(' ')[0] || 'N/A';
                          
                          return (
                            <div
                              key={apt.id}
                              className={`${getStatusColor(apt.status)} text-white text-[8px] sm:text-[10px] p-0.5 sm:p-1 rounded cursor-pointer hover:opacity-90 absolute`}
                              style={{ 
                                height: `${heightInPx}px`,
                                top: '0',
                                left: '1px',
                                right: '1px',
                                zIndex: 10
                              }}
                            >
                              <div className="font-semibold truncate">{firstName}</div>
                              <div className="text-[7px] sm:text-[9px] truncate hidden sm:block">{apt.service_type || apt.title}</div>
                              <div className="text-[7px] sm:text-[9px] mt-0.5 hidden sm:block">
                                {durationMinutes} min
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDay(currentDate);
    
    // Calculate the time range based on business hours and appointments
    const { startHour, endHour } = getTimeSlotRange(currentDate);
    
    // Generate 15-minute intervals only for the calculated range
    const totalSlots = (endHour - startHour) * 4;
    const timeSlots = Array.from({ length: totalSlots }, (_, i) => {
      const totalMinutes = startHour * 60 + i * 15;
      return {
        hour: Math.floor(totalMinutes / 60),
        minute: totalMinutes % 60
      };
    });
    const isClosed = isDayClosed(currentDate);

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-muted">
          <h3 className="font-semibold text-center flex items-center justify-center gap-2">
            {format(currentDate, "EEEE, MMMM dd, yyyy")}
            {isClosed && <span className="text-sm text-red-600 dark:text-red-400">(Closed)</span>}
          </h3>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {timeSlots.map((slot, index) => {
            const isOutsideHours = !isTimeWithinBusinessHours(slot.hour, slot.minute);
            // Only render appointments that START at this exact time slot
            const slotAppointments = dayAppointments.filter(apt => {
              const aptStart = new Date(apt.start_time);
              const aptHour = aptStart.getHours();
              const aptMinute = aptStart.getMinutes();
              const slotMinutes = slot.hour * 60 + slot.minute;
              const aptMinutes = aptHour * 60 + aptMinute;
              return aptMinutes === slotMinutes;
            });

            // Format time label: full time on the hour, just minutes for 15, 30, 45
            const getTimeLabel = () => {
              if (slot.minute === 0) {
                return format(new Date().setHours(slot.hour, 0, 0, 0), "h:mm a").toUpperCase();
              } else {
                return slot.minute.toString();
              }
            };

            return (
              <div key={index} className="flex border-b relative" style={{ minHeight: '40px' }}>
                <div className={`w-16 border-r text-xs text-muted-foreground flex items-start pt-1 px-1 ${
                  (isClosed || isOutsideHours) ? 'bg-red-50 dark:bg-red-950/20' : ''
                }`}>
                  {getTimeLabel()}
                </div>
                <div className={`flex-1 relative ${
                  (isClosed || isOutsideHours) ? 'bg-red-50/50 dark:bg-red-950/10' : ''
                }`}>
                  {slotAppointments.map((apt) => {
                    // Calculate duration in minutes
                    const startTime = new Date(apt.start_time);
                    const endTime = new Date(apt.end_time);
                    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                    const slots = durationMinutes / 15; // Exact slots (can be fractional)
                    const heightInPx = slots * 40 - 1; // 40px per slot, -1px for border
                    
                    // Extract first name only
                    const firstName = apt.customer_name?.split(' ')[0] || 'N/A';
                    
                    return (
                      <div
                        key={apt.id}
                        className={`${getStatusColor(apt.status)} text-white p-2 rounded cursor-pointer hover:opacity-90 absolute`}
                        style={{ 
                          height: `${heightInPx}px`,
                          top: '0',
                          left: '1px',
                          right: '1px',
                          zIndex: 10
                        }}
                      >
                        <div className="font-semibold text-sm">{firstName}</div>
                        <div className="text-xs truncate">{apt.service_type || apt.title}</div>
                        <div className="text-xs mt-0.5">
                          {durationMinutes} min
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const upcomingAppointments = appointments
      .filter(apt => new Date(apt.start_time) >= new Date())
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return (
      <div className="space-y-4">
        {upcomingAppointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No upcoming appointments
          </div>
        ) : (
          upcomingAppointments.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{apt.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)} text-white`}>
                        {apt.status}
                      </span>
                    </div>
                    {apt.description && (
                      <p className="text-sm text-muted-foreground mb-2">{apt.description}</p>
                    )}
                    <div className="flex gap-4 text-sm">
                      <span className="font-medium">
                        {format(new Date(apt.start_time), "EEEE, MMMM dd, yyyy")}
                      </span>
                      <span>
                        {format(new Date(apt.start_time), "h:mm a")} - {format(new Date(apt.end_time), "h:mm a")}
                      </span>
                    </div>
                  </div>
                  {renderCustomerActionsMenu(apt)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  const renderStaffView = () => {
    // Generate 15-minute intervals (96 slots per day)
    const timeSlots = Array.from({ length: 96 }, (_, i) => ({
      hour: Math.floor(i / 4),
      minute: (i % 4) * 15
    }));
    const dayStart = startOfDay(currentDate);
    const dayEnd = endOfDay(currentDate);

    // Filter appointments for the current day
    const dayAppointments = appointments.filter(apt => 
      isWithinInterval(new Date(apt.start_time), { start: dayStart, end: dayEnd })
    );

    // Calculate appointment position and height (15px per 15-minute slot)
    const getAppointmentStyle = (startTime: string, endTime: string) => {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();
      const duration = endMinutes - startMinutes;
      
      return {
        top: `${(startMinutes / 15) * 40}px`, // 40px per 15-minute slot
        height: `${(duration / 15) * 40}px`,
      };
    };

    return (
      <div className="border rounded-lg overflow-x-auto bg-background">
        <div className="min-w-[400px]">
          {/* Header with staff members */}
          <div className="grid border-b bg-muted sticky top-0 z-10" style={{ gridTemplateColumns: `50px repeat(${Math.max(staffMembers.length, 1)}, minmax(100px, 1fr))` }}>
            <div className="p-2 sm:p-3 border-r flex items-center justify-center">
              <span className="text-[10px] sm:text-xs font-semibold">Time</span>
            </div>
            {staffMembers.length > 0 ? (
              staffMembers.map((staff) => (
                <div key={staff.id} className="p-2 sm:p-3 border-r last:border-r-0 flex flex-col items-center gap-1 sm:gap-2">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                    <AvatarImage src={staff.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] sm:text-xs">
                      {staff.first_name?.[0]}{staff.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <div className="text-[10px] sm:text-xs font-semibold truncate max-w-[80px] sm:max-w-none">
                      {staff.display_name || `${staff.first_name} ${staff.last_name?.charAt(0) || ''}.`}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 col-span-full text-center text-xs sm:text-sm text-muted-foreground">
                No team members added yet
              </div>
            )}
          </div>

          {/* Timeline grid */}
          <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto relative">
            {timeSlots.map((slot, index) => {
              const isOutsideHours = !isTimeWithinBusinessHours(slot.hour, slot.minute);
              
              // Format time label: full time on the hour, just minutes for 15, 30, 45
              const getTimeLabel = () => {
                if (slot.minute === 0) {
                  return format(new Date().setHours(slot.hour, 0, 0, 0), "h a");
                } else {
                  return slot.minute.toString();
                }
              };
              
              return (
                <div 
                  key={index} 
                  className="grid border-b relative" 
                  style={{ 
                    gridTemplateColumns: `50px repeat(${Math.max(staffMembers.length, 1)}, minmax(100px, 1fr))`,
                    height: '40px'
                  }}
                >
                  <div className={`px-1 pt-1 border-r text-[10px] sm:text-xs text-muted-foreground flex items-start ${
                    isOutsideHours ? 'bg-muted/50' : ''
                  }`}>
                    {getTimeLabel()}
                  </div>
                
                {staffMembers.map((staff) => {
                  const slotAppointments = dayAppointments.filter(apt => {
                    const aptStart = new Date(apt.start_time);
                    const aptHour = aptStart.getHours();
                    const aptMinute = aptStart.getMinutes();
                    const slotMinutes = slot.hour * 60 + slot.minute;
                    const aptMinutes = aptHour * 60 + aptMinute;
                    return apt.staff_member_id === staff.id && aptMinutes >= slotMinutes && aptMinutes < slotMinutes + 15;
                  });

                  return (
                    <div 
                      key={staff.id} 
                      className={`border-r last:border-r-0 relative ${
                        isOutsideHours ? 'bg-muted/30' : ''
                      }`}
                    >
                      {slotAppointments.map((apt) => {
                        const style = getAppointmentStyle(apt.start_time, apt.end_time);
                        return (
                          <div
                            key={apt.id}
                            className={`absolute left-0.5 right-0.5 sm:left-1 sm:right-1 ${getStatusColor(apt.status)} text-white text-[10px] sm:text-xs p-1 sm:p-2 rounded shadow-sm cursor-pointer hover:opacity-90 overflow-hidden`}
                            style={style}
                            title={`${apt.title}\n${format(new Date(apt.start_time), "h:mm a")} - ${format(new Date(apt.end_time), "h:mm a")}\nCustomer: ${apt.customer_name}`}
                          >
                            <div className="font-semibold truncate text-[9px] sm:text-xs">{apt.title}</div>
                            <div className="text-[8px] sm:text-[10px] truncate">{apt.customer_name}</div>
                            <div className="text-[8px] sm:text-[10px] hidden sm:block">
                              {format(new Date(apt.start_time), "h:mm a")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        </div>
      </div>
    );
  };

  const renderCalendarView = () => {
    switch (viewMode) {
      case "week":
        return renderWeekView();
      case "day":
        return renderDayView();
      case "agenda":
        return renderAgendaView();
      case "staff":
        return renderStaffView();
      default:
        return renderMonthView();
    }
  };

  const openCancelDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  const renderCustomerActionsMenu = (
    appointment: Pick<Appointment, "id" | "title" | "status">,
    entryType: "appointment" | "waiting" = "appointment"
  ) => {
    if (viewType !== "customer" || entryType === "waiting") {
      return null;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => openCancelDialog(appointment as Appointment)}
            disabled={!isAppointmentCancellable(appointment.status)}
            className="text-destructive"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderListView = () => {
    const allEntries = [
      ...appointments.map(apt => ({ ...apt, entryType: 'appointment' as const })),
      ...waitingList.map(entry => ({
        id: entry.id,
        title: entry.services.map((s: any) => s.name).join(', '),
        description: entry.special_requests,
        service_type: entry.services[0]?.name || 'Service',
        start_time: `${entry.requested_date}T00:00:00`,
        end_time: `${entry.requested_date}T00:00:00`,
        status: 'waiting',
        color: null,
        customer_id: entry.customer_id,
        staff_member_id: entry.staff_member_id,
        customer_name: entry.customer_name,
        staff_name: entry.staff_name,
        requested_time: entry.requested_time,
        entryType: 'waiting' as const
      }))
    ].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return (
      <div className="space-y-3">
        {allEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No appointments or waiting list entries
          </div>
        ) : (
          allEntries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{entry.title}</h3>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm">
                      <span>
                        {format(new Date(entry.start_time), "MMM dd, yyyy")}
                      </span>
                      {entry.entryType === 'waiting' ? (
                        <span>{(entry as any).requested_time}</span>
                      ) : (
                        <span>
                          {format(new Date(entry.start_time), "h:mm a")} - {format(new Date(entry.end_time), "h:mm a")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      entry.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                      entry.status === "completed" ? "bg-green-100 text-green-700" :
                      entry.status === "waiting" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {entry.status}
                    </span>
                    {renderCustomerActionsMenu(entry, entry.entryType)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {(viewType === 'business' || viewType === 'staff') && <CheckInSystem />}
      
      <div>
        <p className="text-muted-foreground">
          View and manage your appointments with calendar, list, and status views.
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "calendar" | "list" | "status")}>
        <TabsList className={`grid w-full ${viewType === 'business' ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="calendar" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Calendar</span>
            <span className="xs:hidden">Cal</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <List className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">List View</span>
            <span className="xs:hidden">List</span>
          </TabsTrigger>
          {viewType === 'business' && (
            <TabsTrigger value="status" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <List className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Booking Status</span>
              <span className="xs:hidden">Status</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Calendar View Tab */}
        <TabsContent value="calendar" className="mt-4 sm:mt-6">
              <Card>
                <CardContent className="p-3 sm:p-6">
                  {/* Navigation */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div className="flex gap-1 sm:gap-2">
                      <Button variant="outline" size="sm" onClick={handleToday} className="text-xs sm:text-sm px-2 sm:px-3">
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={handlePrevious} className="text-xs sm:text-sm px-2 sm:px-3">
                        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Back</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleNext} className="text-xs sm:text-sm px-2 sm:px-3">
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-1" />
                      </Button>
                    </div>

                    <h3 className="text-sm sm:text-lg font-semibold text-center order-first sm:order-none">
                      {viewMode === "day" 
                        ? format(currentDate, "MMM dd, yyyy")
                        : viewMode === "week"
                        ? `${format(startOfWeek(currentDate), "MMM dd")} - ${format(endOfWeek(currentDate), "MMM dd, yyyy")}`
                        : viewMode === "staff"
                        ? format(currentDate, "MMM dd, yyyy")
                        : format(currentDate, "MMMM yyyy")}
                    </h3>

                    <div className="flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-end">
                      <Button 
                        variant={viewMode === "month" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setViewMode("month")}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Month
                      </Button>
                      <Button 
                        variant={viewMode === "week" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setViewMode("week")}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Week
                      </Button>
                      <Button 
                        variant={viewMode === "day" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setViewMode("day")}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Day
                      </Button>
                      {(() => {
                        console.log("[MyBookingsPage] Render - viewType:", viewType, "staffMembers.length:", staffMembers.length);
                        return viewType === 'business' && staffMembers.length > 0 && (
                          <Button 
                            variant={viewMode === "staff" ? "default" : "outline"} 
                            size="sm"
                            onClick={() => {
                              console.log("[MyBookingsPage] Switching to staff view");
                              setViewMode("staff");
                            }}
                            className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                          >
                            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                            Staff
                          </Button>
                        );
                      })()}
                      <Button 
                        variant={viewMode === "agenda" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setViewMode("agenda")}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Agenda
                      </Button>
                    </div>
                  </div>

                  {/* Calendar */}
                  {loading ? (
                    <div className="text-center py-12">Loading appointments...</div>
                  ) : (
                    <>
                      {renderCalendarView()}
                      
                      {/* Color Key */}
                      <div className="mt-4 sm:mt-6 p-3 sm:p-4 border rounded-lg">
                        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-8">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-emerald-500"></div>
                            <span className="text-xs sm:text-sm font-medium">Confirmed</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-orange-500"></div>
                            <span className="text-xs sm:text-sm font-medium">Pending</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-500"></div>
                            <span className="text-xs sm:text-sm font-medium">Completed</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

        {/* List View Tab */}
        <TabsContent value="list" className="mt-6">
          {loading ? (
            <div className="text-center py-12">Loading appointments...</div>
          ) : (
            renderListView()
          )}
        </TabsContent>

        {/* Booking Status Tab */}
        <TabsContent value="status" className="mt-4 sm:mt-6">
          <Card>
            <CardContent className="p-3 sm:p-6">
              {loading ? (
                <div className="text-center py-12">Loading appointments...</div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No appointments scheduled
                </div>
              ) : (
                <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full">
                  <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                    <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-8 gap-1">
                      <TabsTrigger value="all" className="text-[10px] sm:text-xs px-2 sm:px-3 whitespace-nowrap">
                        All ({getStatusCount("all")})
                      </TabsTrigger>
                      <TabsTrigger value="scheduled" className="text-[10px] sm:text-xs px-2 sm:px-3 whitespace-nowrap">
                        Sched ({getStatusCount("scheduled")})
                      </TabsTrigger>
                      <TabsTrigger value="waiting" className="text-[10px] sm:text-xs px-2 sm:px-3 whitespace-nowrap">
                        Wait ({getStatusCount("waiting")})
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="text-[10px] sm:text-xs px-2 sm:px-3 whitespace-nowrap">
                        Done ({getStatusCount("completed")})
                      </TabsTrigger>
                      <TabsTrigger value="cancelled" className="text-[10px] sm:text-xs px-2 sm:px-3 whitespace-nowrap">
                        Cancel ({getStatusCount("cancelled")})
                      </TabsTrigger>
                      <TabsTrigger value="no-show" className="text-[10px] sm:text-xs px-2 sm:px-3 whitespace-nowrap">
                        NoShow ({getStatusCount("no-show")})
                      </TabsTrigger>
                      <TabsTrigger value="refunded" className="text-[10px] sm:text-xs px-2 sm:px-3 whitespace-nowrap">
                        Refund ({getStatusCount("refunded")})
                      </TabsTrigger>
                      <TabsTrigger value="rescheduled" className="text-[10px] sm:text-xs px-2 sm:px-3 whitespace-nowrap">
                        Resched ({getStatusCount("rescheduled")})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value={statusFilter} className="mt-6">
                    {(statusFilter === "waiting" ? waitingList.length === 0 : filterAppointmentsByStatus(statusFilter).length === 0) ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No {statusFilter !== "all" ? statusFilter : ""} {statusFilter === "waiting" ? "entries" : "appointments"} found
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-x-auto">
                        <Table className="min-w-[700px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs sm:text-sm">Customer</TableHead>
                              <TableHead className="text-xs sm:text-sm">Date</TableHead>
                              <TableHead className="text-xs sm:text-sm">Time</TableHead>
                              <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Service</TableHead>
                              <TableHead className="text-xs sm:text-sm hidden md:table-cell">Assigned Staff</TableHead>
                              <TableHead className="text-xs sm:text-sm">Status</TableHead>
                              <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {statusFilter === "waiting" ? (
                              waitingList.map((entry) => (
                                <TableRow key={entry.id}>
                                  <TableCell className="font-medium text-xs sm:text-sm">
                                    {entry.customer_name || "N/A"}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {format(new Date(entry.requested_date), "MMM dd")}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {entry.requested_time}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                                    {entry.services.map((s: any) => s.name).join(', ')}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                                    {entry.staff_name || "Not Assigned"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs">
                                      Waiting
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                                      #{waitingList.findIndex(w => w.id === entry.id) + 1}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              filterAppointmentsByStatus(statusFilter).map((apt) => (
                                <TableRow key={apt.id}>
                                  <TableCell className="font-medium text-xs sm:text-sm">
                                    {apt.customer_name || "N/A"}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {format(new Date(apt.start_time), "MMM dd")}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {format(new Date(apt.start_time), "h:mm a")}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                                    {apt.service_type || apt.title}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                                    {apt.staff_name || "Not Assigned"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={getStatusBadgeVariant(apt.status)} className="text-[10px] sm:text-xs">
                                      {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedAppointment(apt);
                                            setRescheduleDialogOpen(true);
                                          }}
                                          disabled={apt.status === "cancelled" || apt.status === "completed"}
                                        >
                                          <CalendarIcon className="w-4 h-4 mr-2" />
                                          Reschedule
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleStatusUpdate(apt.id, "completed")}
                                          disabled={apt.status === "cancelled" || apt.status === "completed"}
                                        >
                                          <CheckCircle2 className="w-4 h-4 mr-2" />
                                          Mark Complete
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleStatusUpdate(apt.id, "no-show")}
                                          disabled={apt.status === "cancelled" || apt.status === "completed"}
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Mark No-Show
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedAppointment(apt);
                                            setCancelDialogOpen(true);
                                          }}
                                          disabled={apt.status === "cancelled" || apt.status === "completed"}
                                          className="text-destructive"
                                        >
                                          <X className="w-4 h-4 mr-2" />
                                          Cancel
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialogs */}
      {selectedAppointment && (
        <>
          <CancelAppointmentDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            appointment={{
              id: selectedAppointment.id,
              title: selectedAppointment.title,
            }}
            onUpdate={fetchAppointments}
            cancelledBy={viewType === "customer" ? "customer" : "staff"}
          />
          <RescheduleAppointmentDialog
            open={rescheduleDialogOpen}
            onOpenChange={setRescheduleDialogOpen}
            appointment={{
              id: selectedAppointment.id,
              title: selectedAppointment.title,
              start_time: selectedAppointment.start_time,
              end_time: selectedAppointment.end_time,
            }}
            onUpdate={fetchAppointments}
          />
        </>
      )}
    </div>
  );
}
