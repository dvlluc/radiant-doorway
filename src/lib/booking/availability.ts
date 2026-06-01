import { supabase } from "@/integrations/supabase/client";
import type { BusySlot } from "./types";
import { buildDayRange, isSlotBlockedByIntervals, rangesOverlap } from "./time";

export async function fetchBusySlots(
  businessId: string,
  staffAuthId: string | null,
  date: Date
): Promise<BusySlot[]> {
  const { rangeStart, rangeEnd } = buildDayRange(date);

  const { data, error } = await supabase.rpc("get_staff_busy_slots", {
    p_business_id: businessId,
    p_staff_auth_id: staffAuthId,
    p_range_start: rangeStart.toISOString(),
    p_range_end: rangeEnd.toISOString(),
  });

  if (error) {
    console.error("fetchBusySlots:", error);
    return [];
  }

  return (data as BusySlot[]) || [];
}

export function blockedTimeToIntervals(
  blockedTimes: Array<{ start_time: string; end_time: string; staff_member_id: string }>,
  staffAuthId: string | null
): Array<{ start: Date; end: Date }> {
  return blockedTimes
    .filter((bt) => !staffAuthId || bt.staff_member_id === staffAuthId)
    .map((bt) => ({
      start: new Date(bt.start_time),
      end: new Date(bt.end_time),
    }));
}

export function busySlotsToIntervals(busySlots: BusySlot[]): Array<{ start: Date; end: Date }> {
  return busySlots.map((slot) => ({
    start: new Date(slot.start_time),
    end: new Date(slot.end_time),
  }));
}

export function isTimeRangeUnavailable(
  slotStart: Date,
  slotEnd: Date,
  blockedIntervals: Array<{ start: Date; end: Date }>,
  busyIntervals: Array<{ start: Date; end: Date }>
): boolean {
  return (
    isSlotBlockedByIntervals(slotStart, slotEnd, blockedIntervals) ||
    isSlotBlockedByIntervals(slotStart, slotEnd, busyIntervals)
  );
}

export function dayHasAvailableSlot(
  date: Date,
  openTime: string,
  closeTime: string,
  durationMinutes: number,
  blockedIntervals: Array<{ start: Date; end: Date }>,
  busyIntervals: Array<{ start: Date; end: Date }>
): boolean {
  const [openHour, openMinute] = openTime.split(":").map(Number);
  const [closeHour, closeMinute] = closeTime.split(":").map(Number);

  let current = new Date(date);
  current.setHours(openHour, openMinute, 0, 0);
  const end = new Date(date);
  end.setHours(closeHour, closeMinute, 0, 0);

  while (current < end) {
    const slotEnd = new Date(current.getTime() + durationMinutes * 60_000);
    if (slotEnd <= end && !isTimeRangeUnavailable(current, slotEnd, blockedIntervals, busyIntervals)) {
      return true;
    }
    current = new Date(current.getTime() + 30 * 60_000);
  }

  return false;
}

export { rangesOverlap };
