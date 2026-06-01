import { addMinutes, format, setHours, setMinutes, startOfDay } from "date-fns";

export function parseTimeLabelToDate(date: Date, timeLabel: string): Date {
  const [timeStr, period] = timeLabel.split(" ");
  let [hours, minutes] = timeStr.split(":").map(Number);

  if (period?.toLowerCase() === "pm" && hours !== 12) {
    hours += 12;
  } else if (period?.toLowerCase() === "am" && hours === 12) {
    hours = 0;
  }

  return setMinutes(setHours(startOfDay(date), hours), minutes);
}

export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && endA > startB;
}

export function isSlotBlockedByIntervals(
  slotStart: Date,
  slotEnd: Date,
  intervals: Array<{ start: Date; end: Date }>
): boolean {
  return intervals.some((interval) =>
    rangesOverlap(slotStart, slotEnd, interval.start, interval.end)
  );
}

export function buildDayRange(date: Date): { rangeStart: Date; rangeEnd: Date } {
  const rangeStart = startOfDay(date);
  const rangeEnd = addMinutes(rangeStart, 24 * 60);
  return { rangeStart, rangeEnd };
}

export function formatSlotLabel(date: Date): string {
  return format(date, "hh:mm a");
}
