import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, addWeeks, setHours, setMinutes, parseISO } from "date-fns";
import { CalendarIcon, Clock, Repeat, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onUpdate: () => void;
}

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const h = hour.toString().padStart(2, "0");
  return `${h}:${minute}`;
});

const DAYS_OF_WEEK = [
  { label: "Mon", value: "Monday" },
  { label: "Tue", value: "Tuesday" },
  { label: "Wed", value: "Wednesday" },
  { label: "Thu", value: "Thursday" },
  { label: "Fri", value: "Friday" },
  { label: "Sat", value: "Saturday" },
  { label: "Sun", value: "Sunday" },
];

const QUICK_REASONS = [
  "Lunch break",
  "Personal appointment",
  "Training",
  "Meeting",
  "Day off",
  "Holiday",
];

export function BlockTimeDialog({ open, onOpenChange, businessId, onUpdate }: BlockTimeDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [repeatType, setRepeatType] = useState("none");
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [repeatEndDate, setRepeatEndDate] = useState<Date | undefined>(undefined);
  const [allDay, setAllDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setSelectedDate(new Date());
    setStartTime("09:00");
    setEndTime("10:00");
    setReason("");
    setRepeatType("none");
    setRepeatDays([]);
    setRepeatEndDate(undefined);
    setAllDay(false);
  };

  const buildDateTime = (date: Date, time: string): string => {
    const [h, m] = time.split(":").map(Number);
    const dt = setMinutes(setHours(new Date(date), h), m);
    return dt.toISOString();
  };

  const toggleRepeatDay = (day: string) => {
    setRepeatDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleBlockTime = async () => {
    if (!selectedDate) {
      toast({ title: "Please select a date", variant: "destructive" });
      return;
    }

    const effectiveStart = allDay ? "00:00" : startTime;
    const effectiveEnd = allDay ? "23:59" : endTime;

    if (effectiveStart >= effectiveEnd) {
      toast({ title: "End time must be after start time", variant: "destructive" });
      return;
    }

    if (repeatType === "custom" && repeatDays.length === 0) {
      toast({ title: "Please select at least one day to repeat", variant: "destructive" });
      return;
    }

    if (repeatType !== "none" && !repeatEndDate) {
      toast({ title: "Please select an end date for the repeat", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const startDateTime = buildDateTime(selectedDate, effectiveStart);
      const endDateTime = buildDateTime(selectedDate, effectiveEnd);

      const { error } = await supabase
        .from("blocked_time")
        .insert({
          staff_member_id: user.id,
          business_id: businessId,
          start_time: startDateTime,
          end_time: endDateTime,
          reason: reason || null,
          repeat_type: repeatType,
          repeat_days: repeatType === "custom" ? repeatDays : [],
          repeat_end_date: repeatEndDate ? format(repeatEndDate, "yyyy-MM-dd") : null,
        });

      if (error) throw error;

      toast({
        title: "Time blocked",
        description: repeatType !== "none"
          ? "Your recurring unavailable time has been recorded."
          : "Your unavailable time has been recorded.",
      });

      onUpdate();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error blocking time:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to block time. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Block Time
          </DialogTitle>
          <DialogDescription>
            Mark yourself as unavailable. You can also set this to repeat automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="all-day"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="all-day" className="text-sm cursor-pointer">All day</Label>
          </div>

          {/* Time Selectors */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Time</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">End Time</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Quick Reason Buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reason (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map(r => (
                <Button
                  key={r}
                  type="button"
                  variant={reason === r ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setReason(reason === r ? "" : r)}
                >
                  {r}
                </Button>
              ))}
            </div>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Or type a custom reason..."
              rows={2}
              className="mt-2"
            />
          </div>

          {/* Repeat Options */}
          <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Repeat</Label>
            </div>

            <Select value={repeatType} onValueChange={setRepeatType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Every day</SelectItem>
                <SelectItem value="weekly">Every week</SelectItem>
                <SelectItem value="custom">Custom days</SelectItem>
              </SelectContent>
            </Select>

            {repeatType === "custom" && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Select days</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS_OF_WEEK.map(day => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={repeatDays.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      className="h-9 w-11 text-xs px-0"
                      onClick={() => toggleRepeatDay(day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {repeatType !== "none" && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Repeat until</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-sm",
                        !repeatEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {repeatEndDate ? format(repeatEndDate, "MMMM d, yyyy") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={repeatEndDate}
                      onSelect={setRepeatEndDate}
                      disabled={(date) => date < (selectedDate || new Date())}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); resetForm(); }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleBlockTime} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Blocking...
                </>
              ) : (
                "Block Time"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
