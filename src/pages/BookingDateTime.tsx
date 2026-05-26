import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Star, MapPin, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Camera, X, Upload } from "lucide-react";
import { format, addMinutes, setHours, setMinutes, startOfDay } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { getCurrencyFromLocation } from "@/utils/currency";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Professional {
  id: string;
  member_id: string;
  email: string;
  title: string | null;
  specialties: string | null;
  bio?: string | null;
  avgRating?: number;
  reviewCount?: number;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface BusinessProfile {
  business_name: string;
  address: string;
  avatar_url: string | null;
}

interface BusinessHours {
  day_of_week: string;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
}

interface BlockedTime {
  start_time: string;
  end_time: string;
  staff_member_id: string;
}

interface WaitingListEntry {
  requested_time: string;
  requested_date: string;
  staff_member_id: string;
}

export default function BookingDateTime() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { services = [], businessId, businessName } = location.state || {};
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedProfessional, setSelectedProfessional] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState<string>("");
  const [hairPhotoUrl, setHairPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [waitingListCounts, setWaitingListCounts] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<{ time: string; status: string; waitingCount: number }[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [calendarView, setCalendarView] = useState<"monthly" | "weekly">("monthly");
  const [isJoiningWaitingList, setIsJoiningWaitingList] = useState(false);

  const professionalLocation = business?.address || "United States";
  const currency = getCurrencyFromLocation(professionalLocation);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to continue booking.",
          variant: "destructive",
        });
        navigate("/auth", { state: { returnTo: `/booking/${id}/datetime` } });
        return;
      }
      
      setIsAuthenticated(true);
    };

    checkAuth();
  }, [id, navigate, toast]);

  useEffect(() => {
    const fetchData = async () => {
      if (!businessId || !isAuthenticated) return;

      try {
        // Fetch business profile
        const { data: businessData, error: businessError } = await supabase
          .from("business_profiles")
          .select("business_name, address, avatar_url")
          .eq("user_id", businessId)
          .single();

        if (businessError) throw businessError;
        setBusiness(businessData);

        // Fetch team members
        const { data: teamData, error: teamError } = await supabase
          .from("team_members")
          .select("id, member_id, email, title, specialties, bio")
          .eq("business_id", businessId)
          .eq("status", "accepted");

        if (teamError) throw teamError;

        // Fetch profiles for team members
        if (teamData && teamData.length > 0) {
          // Fetch reviews for all staff members
          const teamMemberIds = teamData.map(m => m.id);
          const { data: staffReviews } = await supabase
            .from('reviews')
            .select('staff_member_id, rating')
            .in('staff_member_id', teamMemberIds);

          const reviewsByStaff: Record<string, number[]> = {};
          (staffReviews || []).forEach(r => {
            if (r.staff_member_id) {
              if (!reviewsByStaff[r.staff_member_id]) reviewsByStaff[r.staff_member_id] = [];
              reviewsByStaff[r.staff_member_id].push(r.rating);
            }
          });

          const enrichedTeamData = await Promise.all(
            teamData.map(async (member) => {
              const ratings = reviewsByStaff[member.id] || [];
              const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
              const reviewCount = ratings.length;

              // Try to get profile by member_id first
              if (member.member_id) {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("id, first_name, last_name, avatar_url")
                  .eq("id", member.member_id)
                  .maybeSingle();

                if (profile) {
                  return { ...member, profile, avgRating, reviewCount };
                }
              }
              
              // If no member_id or profile not found, try to look up by email
              if (member.email) {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("id, first_name, last_name, avatar_url")
                  .eq("email", member.email)
                  .maybeSingle();

                if (profile) {
                  return { 
                    ...member, 
                    member_id: profile.id,
                    profile,
                    avgRating,
                    reviewCount,
                  };
                }
              }
              
              return { ...member, avgRating, reviewCount };
            })
          );
          
          setProfessionals(enrichedTeamData || []);
          
          // Auto-select if only one professional
          if (enrichedTeamData.length === 1 && !selectedProfessional) {
            setSelectedProfessional(enrichedTeamData[0].id);
          }
        } else {
          setProfessionals([]);
          // No professionals - set a flag so date/time selection shows immediately
          setSelectedProfessional("no-professional");
        }

        // Fetch business hours
        const { data: hoursData, error: hoursError } = await supabase
          .from("business_hours")
          .select("day_of_week, is_open, open_time, close_time")
          .eq("user_id", businessId);

        if (hoursError) throw hoursError;
        setBusinessHours(hoursData || []);

        // Fetch blocked times
        const { data: blockedData, error: blockedError } = await supabase
          .from("blocked_time")
          .select("start_time, end_time, staff_member_id")
          .eq("business_id", businessId);

        if (blockedError) throw blockedError;
        setBlockedTimes(blockedData || []);

        // Fetch waiting list counts
        const { data: waitingData, error: waitingError } = await supabase
          .from("waiting_list")
          .select("requested_time, requested_date, staff_member_id")
          .eq("business_id", businessId)
          .eq("status", "active");

        if (waitingError) throw waitingError;
        setWaitingListCounts(waitingData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load booking information.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId, toast, isAuthenticated]);

  // Helper function to check if a date should be disabled
  const isDayDisabled = (date: Date) => {
    // If no business hours are configured, allow all future weekdays
    if (businessHours.length === 0) {
      return date < startOfDay(new Date());
    }

    const dayOfWeek = format(date, "EEEE");
    const dayHours = businessHours.find(h => h.day_of_week === dayOfWeek);
    
    // Disable if business is closed that day
    if (!dayHours || !dayHours.is_open || !dayHours.open_time || !dayHours.close_time) {
      return true;
    }

    // If a real professional is selected, check if they have any available time slots
    if (selectedProfessional && selectedProfessional !== "no-professional" && blockedTimes.length > 0) {
      const selectedProf = professionals.find(p => p.id === selectedProfessional);
      if (!selectedProf?.member_id) return false;
      
      const [openHour, openMinute] = dayHours.open_time.split(":").map(Number);
      const [closeHour, closeMinute] = dayHours.close_time.split(":").map(Number);
      
      let currentTime = setMinutes(setHours(startOfDay(date), openHour), openMinute);
      const endTime = setMinutes(setHours(startOfDay(date), closeHour), closeMinute);
      
      let hasAvailableSlot = false;
      while (currentTime < endTime) {
        const isBlocked = blockedTimes.some(bt => {
          if (bt.staff_member_id !== selectedProf.member_id) return false;
          const blockStart = new Date(bt.start_time);
          const blockEnd = new Date(bt.end_time);
          return currentTime >= blockStart && currentTime < blockEnd;
        });
        
        if (!isBlocked) {
          hasAvailableSlot = true;
          break;
        }
        
        currentTime = addMinutes(currentTime, 30);
      }
      
      return !hasAvailableSlot;
    }
    
    return false;
  };

  useEffect(() => {
    if (!selectedDate) return;

    const dayOfWeek = format(selectedDate, "EEEE");
    const dayHours = businessHours.find(h => h.day_of_week === dayOfWeek);

    // Use configured hours or default to 9:00 - 17:00
    let openTime = "09:00";
    let closeTime = "17:00";

    if (businessHours.length > 0) {
      if (!dayHours || !dayHours.is_open || !dayHours.open_time || !dayHours.close_time) {
        setTimeSlots([]);
        return;
      }
      openTime = dayHours.open_time;
      closeTime = dayHours.close_time;
    }

    const [openHour, openMinute] = openTime.split(":").map(Number);
    const [closeHour, closeMinute] = closeTime.split(":").map(Number);

    const slots: { time: string; status: string; waitingCount: number }[] = [];
    let currentTime = setMinutes(setHours(startOfDay(selectedDate), openHour), openMinute);
    const endTime = setMinutes(setHours(startOfDay(selectedDate), closeHour), closeMinute);

    const noProfessional = selectedProfessional === "no-professional";

    while (currentTime < endTime) {
      const timeStr = format(currentTime, "hh:mm a");
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      let isBlocked = false;
      let waitingCount = 0;

      if (!noProfessional) {
        const selectedProf = professionals.find(p => p.id === selectedProfessional);
        isBlocked = !!(selectedProf?.member_id && blockedTimes.some(bt => {
          if (bt.staff_member_id !== selectedProf.member_id) return false;
          const blockStart = new Date(bt.start_time);
          const blockEnd = new Date(bt.end_time);
          return currentTime >= blockStart && currentTime < blockEnd;
        }));

        waitingCount = selectedProf?.member_id ? waitingListCounts.filter(wl => 
          wl.staff_member_id === selectedProf.member_id &&
          wl.requested_time === timeStr &&
          wl.requested_date === dateStr
        ).length : 0;
      }

      let status = "available";
      if (isBlocked) {
        status = waitingCount < 5 ? "waiting-list" : "not-available";
      }

      slots.push({
        time: timeStr,
        status,
        waitingCount
      });

      currentTime = addMinutes(currentTime, 30);
    }

    setTimeSlots(slots);
  }, [selectedDate, businessHours, selectedProfessional, blockedTimes, waitingListCounts]);

  const totalDuration = services.reduce((sum: number, s: any) => sum + s.duration, 0);
  const totalPrice = services.reduce((sum: number, s: any) => sum + s.price, 0);

  const handleTimeSlotClick = async (slot: { time: string; status: string; waitingCount: number }) => {
    if (slot.status === "not-available") return;

    if (slot.status === "waiting-list") {
      // Join waiting list via edge function
      setIsJoiningWaitingList(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase.functions.invoke('add-to-waiting-list', {
          body: {
            business_id: businessId,
            staff_member_id: selectedProfessional,
            requested_date: format(selectedDate!, "yyyy-MM-dd"),
            requested_time: slot.time,
            services: services,
            special_requests: specialRequests,
            business_name: businessName,
          }
        });

        if (error) throw error;

        toast({
          title: "Added to Waiting List",
          description: `You've been added to the waiting list for ${slot.time}. You'll be notified if a slot opens up.`,
        });

        setSelectedTime(slot.time);
      } catch (error) {
        console.error("Error joining waiting list:", error);
        toast({
          title: "Error",
          description: "Failed to join waiting list. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsJoiningWaitingList(false);
      }
    } else {
      setSelectedTime(slot.time);
      setIsJoiningWaitingList(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('booking-photos')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('booking-photos')
        .getPublicUrl(filePath);
      
      setHairPhotoUrl(publicUrl);
      toast({ title: "Photo uploaded", description: "Your hair photo has been attached." });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: "Could not upload photo. Please try again.", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setHairPhotoUrl(null);
  };

  const handleContinue = () => {
    const selectedProf = professionals.length > 0 ? professionals.find(p => p.id === selectedProfessional) : null;
    const selectedSlot = timeSlots.find(s => s.time === selectedTime);
    
    navigate(`/booking/${id}/payment`, {
      state: {
        services,
        date: selectedDate,
        time: selectedTime,
        professional: selectedProf || null,
        professionalId: selectedProf?.member_id || null,
        businessId,
        businessName,
        specialRequests,
        hairPhotoUrl,
        isWaitingList: selectedSlot?.status === "waiting-list",
      },
    });
  };

  const getStaffName = (prof: Professional) => {
    if (prof.profile?.first_name) {
      return prof.profile.first_name;
    }
    return prof.email.split('@')[0];
  };

  const getStaffDescription = (prof: Professional) => {
    return prof.specialties?.trim() || prof.bio?.trim() || "Service details available on request";
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 text-center">
        <p>Loading availability...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-10 sm:w-10"
          onClick={() => navigate(`/booking/${id}`)}
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-['Playfair_Display']">Complete Your Booking</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Select Professional - only show if there are team members */}
          {professionals.length > 0 && (
            <Card className="p-3 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 mb-3 sm:mb-4">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black text-white flex items-center justify-center text-xs sm:text-sm">
                  1
                </span>
                Select Professional
              </h3>

              <div className="space-y-2 sm:space-y-3">
                {professionals.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => {
                      setSelectedProfessional(prof.id);
                      setSelectedDate(undefined);
                      setSelectedTime("");
                    }}
                    className={`w-full p-3 sm:p-4 rounded-lg border transition-all bg-card ${
                      selectedProfessional === prof.id
                        ? "border-foreground"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                        {prof.profile?.avatar_url && <AvatarImage src={prof.profile.avatar_url} />}
                        <AvatarFallback className="bg-foreground text-background text-xs sm:text-sm">
                          {getStaffName(prof).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base">{getStaffName(prof)}</h4>
                          {(prof.title?.trim() || prof.specialties?.trim()) && (
                            <>
                              <div className="h-4 w-px bg-border shrink-0" />
                              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">{prof.title?.trim() || prof.specialties?.trim() || ''}</span>
                            </>
                          )}
                          <div className="h-4 w-px bg-border shrink-0" />
                          <div className="flex items-center gap-1 shrink-0">
                            <Star className={`w-3.5 h-3.5 ${(prof.reviewCount || 0) > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                            <span className="font-medium text-foreground text-sm">
                              {(prof.reviewCount || 0) > 0 ? (prof.avgRating || 0).toFixed(1) : '-'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(prof.reviewCount || 0) > 0 
                                ? `(${prof.reviewCount} review${prof.reviewCount !== 1 ? 's' : ''})` 
                                : '(No reviews)'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed break-words">
                          {getStaffDescription(prof)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Date & Time Selection */}
          {selectedProfessional && (
            <Card className="p-3 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 mb-3 sm:mb-4">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                Select Date & Time
              </h3>

              {/* View Toggle */}
              <div className="flex gap-2 mb-3 sm:mb-4">
                <Button
                  variant={calendarView === "monthly" ? "default" : "outline"}
                  onClick={() => setCalendarView("monthly")}
                  size="sm"
                  className={`text-xs sm:text-sm ${calendarView === "monthly" ? "bg-black text-white hover:bg-black/90" : ""}`}
                >
                  Monthly
                </Button>
                <Button
                  variant={calendarView === "weekly" ? "default" : "outline"}
                  onClick={() => setCalendarView("weekly")}
                  size="sm"
                  className={`text-xs sm:text-sm ${calendarView === "weekly" ? "bg-black text-white hover:bg-black/90" : ""}`}
                >
                  Weekly
                </Button>
              </div>

              {/* Calendar - Monthly or Weekly View */}
              {calendarView === "monthly" ? (
                <div className="w-full">
                  {/* Monthly View Header */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg font-medium">
                      {selectedDate ? format(selectedDate, "MMMM yyyy") : format(new Date(), "MMMM yyyy")}
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => {
                          const newDate = selectedDate ? new Date(selectedDate) : new Date();
                          newDate.setMonth(newDate.getMonth() - 1);
                          setSelectedDate(newDate);
                          setSelectedTime("");
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => {
                          const newDate = selectedDate ? new Date(selectedDate) : new Date();
                          newDate.setMonth(newDate.getMonth() + 1);
                          setSelectedDate(newDate);
                          setSelectedTime("");
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Monthly Calendar Grid */}
                  <div className="w-full">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 mb-2">
                      {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                        <div key={day} className="text-center text-[10px] sm:text-sm font-medium text-muted-foreground py-1 sm:py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Date Grid */}
                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                      {(() => {
                        const baseDate = selectedDate || new Date();
                        const year = baseDate.getFullYear();
                        const month = baseDate.getMonth();
                        const firstDay = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const startOffset = firstDay === 0 ? 6 : firstDay - 1;
                        const cells = [];

                        // Empty cells before month starts
                        for (let i = 0; i < startOffset; i++) {
                          cells.push(
                            <div key={`empty-${i}`} className="h-10 sm:h-14 md:h-20 bg-transparent"></div>
                          );
                        }

                        // Days of the month
                        for (let day = 1; day <= daysInMonth; day++) {
                          const currentDate = new Date(year, month, day);
                          const isSelected = selectedDate && format(currentDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                          const isToday = format(currentDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                          const isPast = currentDate < new Date(new Date().setHours(0, 0, 0, 0));
                          const isDisabled = isPast || isDayDisabled(currentDate);

                          cells.push(
                            <button
                              key={day}
                              onClick={() => {
                                if (!isDisabled) {
                                  setSelectedDate(currentDate);
                                  setSelectedTime("");
                                }
                              }}
                              disabled={isDisabled}
                              className={`h-10 sm:h-14 md:h-20 rounded-md sm:rounded-lg flex items-center justify-center text-xs sm:text-sm md:text-base font-semibold transition-all ${
                                isSelected
                                  ? "bg-black text-white"
                                  : isToday && !isDisabled
                                  ? "bg-blue-100 text-blue-900"
                                  : isDisabled
                                  ? "text-muted-foreground/40 cursor-not-allowed bg-muted/20"
                                  : "hover:bg-muted"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        }

                        return cells;
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  {/* Weekly View Header */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-lg font-medium">
                      {selectedDate 
                        ? `${format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - selectedDate.getDay() + 1), "d")} - ${format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - selectedDate.getDay() + 7), "d MMM yyyy")}`
                        : format(new Date(), "MMMM yyyy")
                      }
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => {
                          const newDate = selectedDate ? new Date(selectedDate) : new Date();
                          newDate.setDate(newDate.getDate() - 7);
                          setSelectedDate(newDate);
                          setSelectedTime("");
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        onClick={() => {
                          const newDate = selectedDate ? new Date(selectedDate) : new Date();
                          newDate.setDate(newDate.getDate() + 7);
                          setSelectedDate(newDate);
                          setSelectedTime("");
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Weekly Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4 sm:mb-6">
                    {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                      <div key={day} className="text-center text-[10px] sm:text-sm font-medium text-muted-foreground py-1 sm:py-2">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: 7 }).map((_, index) => {
                      const baseDate = selectedDate || new Date();
                      const weekStart = new Date(baseDate);
                      weekStart.setDate(baseDate.getDate() - baseDate.getDay() + 1); // Monday
                      const currentDate = new Date(weekStart);
                      currentDate.setDate(weekStart.getDate() + index);
                      const isSelected = selectedDate && format(currentDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                      const isPast = currentDate < new Date(new Date().setHours(0, 0, 0, 0));
                      const isDisabled = isPast || isDayDisabled(currentDate);

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (!isDisabled) {
                              setSelectedDate(currentDate);
                              setSelectedTime("");
                            }
                          }}
                          disabled={isDisabled}
                          className={`h-10 sm:h-16 rounded-md sm:rounded-lg border sm:border-2 transition-all ${
                            isSelected
                              ? "bg-black text-white border-black"
                              : isDisabled
                              ? "bg-muted/30 text-muted-foreground border-transparent cursor-not-allowed"
                              : "border-border hover:border-black"
                          }`}
                        >
                          <div className="text-xs sm:text-sm font-semibold">{format(currentDate, "d")}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Time Slots */}
              {selectedDate && (
                <div className="mt-4 sm:mt-6">
                  <h4 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Select Time Slot</h4>
                  
                  {timeSlots.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">
                      No available time slots for this date. The business is closed or fully booked.
                    </div>
                  ) : (
                    <>
                      {/* Legend */}
                      <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-background border rounded" />
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-black rounded" />
                          <span>Selected</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-muted-foreground/30 rounded" />
                          <span>Waiting List ({"{<5}"})</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-muted rounded" />
                          <span>Not Available</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                        {timeSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            variant={
                              selectedTime === slot.time
                                ? "default"
                                : slot.status === "not-available"
                                ? "ghost"
                                : "outline"
                            }
                            size="sm"
                            disabled={slot.status === "not-available" || isJoiningWaitingList}
                            onClick={() => handleTimeSlotClick(slot)}
                            className={`relative text-xs sm:text-sm h-9 sm:h-10 ${
                              selectedTime === slot.time
                                ? "bg-black text-white hover:bg-black/90"
                                : slot.status === "waiting-list"
                                ? "bg-muted-foreground/30 hover:bg-muted-foreground/40"
                                : slot.status === "not-available"
                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {slot.time}
                            {slot.status === "waiting-list" && (
                              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                                {slot.waitingCount}
                              </span>
                            )}
                          </Button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Special Requests */}
          {selectedTime && (
            <Card className="p-3 sm:p-6">
              <h4 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Special Requests (Optional)</h4>
              <Textarea
                placeholder="Any special requests or notes for your appointment..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
              />

              {/* Hair Photo Upload */}
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Upload a photo of your current hair (optional)</p>
                {hairPhotoUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={hairPhotoUrl}
                      alt="Current hair"
                      className="w-24 h-24 rounded-xl object-cover border border-border"
                    />
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2.5 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    {uploadingPhoto ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {uploadingPhoto ? "Uploading..." : "Add Photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </label>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Booking Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-3 sm:p-6 lg:sticky lg:top-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Booking Summary</h3>

            {selectedDate && (
              <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  Date
                </h4>
                <p className="font-medium text-sm sm:text-base">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            )}

            {selectedTime && (
              <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  Time
                </h4>
                <p className="font-medium text-sm sm:text-base">{selectedTime}</p>
                {isJoiningWaitingList && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    (Joining waiting list...)
                  </p>
                )}
                {timeSlots.find(s => s.time === selectedTime)?.status === "waiting-list" && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    (Waiting list position: {timeSlots.find(s => s.time === selectedTime)?.waitingCount! + 1})
                  </p>
                )}
              </div>
            )}

            <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                Services
              </h4>
              <div className="space-y-1 sm:space-y-2">
                {services.map((service: any, index: number) => (
                  <div key={index} className="flex justify-between text-xs sm:text-sm">
                    <span className="truncate mr-2">{service.name}</span>
                    <span className="font-semibold flex-shrink-0">{currency.symbol}{service.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Total Duration:</span>
                <span className="font-semibold">{totalDuration} minutes</span>
              </div>
              <div className="flex justify-between text-sm sm:text-lg font-bold">
                <span>Total Price:</span>
                <span>{currency.symbol}{totalPrice}</span>
              </div>
            </div>

            <Button
              className="w-full bg-black hover:bg-black/90 text-white text-sm sm:text-base"
              onClick={handleContinue}
              disabled={!selectedDate || !selectedTime}
            >
              Review Booking
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
