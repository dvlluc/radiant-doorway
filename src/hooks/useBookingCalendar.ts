import { useEffect, useMemo, useState } from "react";
import { addMinutes, format, setHours, setMinutes, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  blockedTimeToIntervals,
  busySlotsToIntervals,
  dayHasAvailableSlot,
  fetchBusySlots,
  isTimeRangeUnavailable,
} from "@/lib/booking/availability";
import { formatSlotLabel, parseTimeLabelToDate } from "@/lib/booking/time";

export interface BookingProfessional {
  id: string;
  member_id: string | null;
  email: string;
  title: string | null;
  specialties: string | null;
  bio?: string | null;
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

export function useBookingCalendar(
  businessId: string | undefined,
  durationMinutes: number,
  enabled: boolean
) {
  const [professionals, setProfessionals] = useState<BookingProfessional[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [busySlots, setBusySlots] = useState<Array<{ start_time: string; end_time: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    if (!businessId || !enabled) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data: teamData } = await supabase
          .from("team_members")
          .select("id, member_id, email, title, specialties, bio")
          .eq("business_id", businessId)
          .eq("status", "accepted");

        setProfessionals(teamData || []);

        if (teamData?.length === 1) {
          setSelectedProfessional(teamData[0].id);
        } else if (!teamData?.length) {
          setSelectedProfessional("no-professional");
        }

        const { data: hoursData } = await supabase
          .from("business_hours")
          .select("day_of_week, is_open, open_time, close_time")
          .eq("user_id", businessId);

        setBusinessHours(hoursData || []);

        const { data: blockedData } = await supabase
          .from("blocked_time")
          .select("start_time, end_time, staff_member_id")
          .eq("business_id", businessId);

        setBlockedTimes(blockedData || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [businessId, enabled]);

  const selectedStaffAuthId = useMemo(() => {
    if (selectedProfessional === "no-professional") return null;
    const prof = professionals.find((p) => p.id === selectedProfessional);
    return prof?.member_id || null;
  }, [professionals, selectedProfessional]);

  useEffect(() => {
    if (!businessId || !selectedDate || !enabled) {
      setBusySlots([]);
      return;
    }

    fetchBusySlots(businessId, selectedStaffAuthId, selectedDate).then(setBusySlots);
  }, [businessId, selectedDate, selectedStaffAuthId, enabled]);

  const blockedIntervals = useMemo(
    () => blockedTimeToIntervals(blockedTimes, selectedStaffAuthId),
    [blockedTimes, selectedStaffAuthId]
  );

  const busyIntervals = useMemo(() => busySlotsToIntervals(busySlots), [busySlots]);

  const isDayDisabled = (date: Date) => {
    if (date < startOfDay(new Date())) return true;

    const dayOfWeek = format(date, "EEEE");
    const dayHours = businessHours.find((h) => h.day_of_week === dayOfWeek);

    let openTime = "09:00";
    let closeTime = "17:00";

    if (businessHours.length > 0) {
      if (!dayHours?.is_open || !dayHours.open_time || !dayHours.close_time) {
        return true;
      }
      openTime = dayHours.open_time;
      closeTime = dayHours.close_time;
    }

    if (!selectedProfessional) return true;

    // Day-level uses blocked time only; appointment conflicts checked per slot.
    return !dayHasAvailableSlot(
      date,
      openTime,
      closeTime,
      durationMinutes,
      blockedIntervals,
      []
    );
  };

  const timeSlots = useMemo(() => {
    if (!selectedDate || !selectedProfessional) return [];

    const dayOfWeek = format(selectedDate, "EEEE");
    const dayHours = businessHours.find((h) => h.day_of_week === dayOfWeek);

    let openTime = "09:00";
    let closeTime = "17:00";

    if (businessHours.length > 0) {
      if (!dayHours?.is_open || !dayHours.open_time || !dayHours.close_time) {
        return [];
      }
      openTime = dayHours.open_time;
      closeTime = dayHours.close_time;
    }

    const [openHour, openMinute] = openTime.split(":").map(Number);
    const [closeHour, closeMinute] = closeTime.split(":").map(Number);

    const slots: { time: string; status: "available" | "not-available" }[] = [];
    let currentTime = setMinutes(setHours(startOfDay(selectedDate), openHour), openMinute);
    const endTime = setMinutes(setHours(startOfDay(selectedDate), closeHour), closeMinute);

    while (currentTime < endTime) {
      const slotEnd = addMinutes(currentTime, durationMinutes);
      const unavailable =
        slotEnd > endTime ||
        isTimeRangeUnavailable(currentTime, slotEnd, blockedIntervals, busyIntervals);

      slots.push({
        time: formatSlotLabel(currentTime),
        status: unavailable ? "not-available" : "available",
      });

      currentTime = addMinutes(currentTime, 30);
    }

    return slots;
  }, [
    selectedDate,
    businessHours,
    selectedProfessional,
    durationMinutes,
    blockedIntervals,
    busyIntervals,
  ]);

  const getSelectedRange = () => {
    if (!selectedDate || !selectedTime) return null;
    const start = parseTimeLabelToDate(selectedDate, selectedTime);
    const end = addMinutes(start, durationMinutes);
    return { start, end };
  };

  return {
    loading,
    professionals,
    businessHours,
    selectedProfessional,
    setSelectedProfessional,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    timeSlots,
    isDayDisabled,
    selectedStaffAuthId,
    getSelectedRange,
  };
}
