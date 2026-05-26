import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, CalendarOff, Plus, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { BlockTimeDialog } from "@/components/staff/BlockTimeDialog";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface BusinessHour {
  day_of_week: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

interface BlockedTime {
  id: string;
  staff_member_id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  repeat_type: string;
  repeat_days: string[] | null;
  repeat_end_date: string | null;
}

interface StaffMember {
  id: string;
  member_id: string | null;
  email: string;
  status: string;
  member_name?: string;
  member_avatar?: string;
}

export const BusinessHours = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [hoursRes, settingsRes, teamRes, blockedRes] = await Promise.all([
        supabase.from("business_hours").select("*").eq("user_id", user.id),
        supabase.from("business_settings").select("show_opening_hours").eq("user_id", user.id).maybeSingle(),
        supabase.from("team_members").select("id, member_id, email, status").eq("business_id", user.id).neq("status", "terminated"),
        supabase.from("blocked_time").select("*").eq("business_id", user.id).order("start_time", { ascending: true }),
      ]);

      if (settingsRes.data) setShowOnProfile(settingsRes.data.show_opening_hours);

      const hoursData = DAYS_OF_WEEK.map(day => {
        const existing = hoursRes.data?.find(h => h.day_of_week === day);
        return existing || { day_of_week: day, is_open: false, open_time: "09:00", close_time: "17:00" };
      });
      setHours(hoursData);

      // Load staff member profiles
      const members = teamRes.data || [];
      const memberIds = members.filter(m => m.member_id).map(m => m.member_id!);
      let profileMap: Record<string, { first_name: string | null; avatar_url: string | null }> = {};
      if (memberIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, avatar_url")
          .in("id", memberIds);
        profiles?.forEach(p => { profileMap[p.id] = p; });
      }

      setStaffMembers(members.map(m => ({
        ...m,
        member_name: m.member_id && profileMap[m.member_id] ? profileMap[m.member_id].first_name || undefined : undefined,
        member_avatar: m.member_id && profileMap[m.member_id] ? profileMap[m.member_id].avatar_url || undefined : undefined,
      })));

      setBlockedTimes(blockedRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShowOnProfile = async (checked: boolean) => {
    setShowOnProfile(checked);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("business_settings")
        .upsert({ user_id: user.id, show_opening_hours: checked }, { onConflict: "user_id" });
    } catch (error) {
      console.error("Error saving show setting:", error);
    }
  };

  const handleToggleDay = (day: string) => {
    setHours(prev => prev.map(h => h.day_of_week === day ? { ...h, is_open: !h.is_open } : h));
  };

  const handleTimeChange = (day: string, field: "open_time" | "close_time", value: string) => {
    setHours(prev => prev.map(h => h.day_of_week === day ? { ...h, [field]: value } : h));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates = hours.map(h => ({
        user_id: user.id,
        day_of_week: h.day_of_week,
        is_open: h.is_open,
        open_time: h.open_time,
        close_time: h.close_time,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("business_hours")
        .upsert(updates, { onConflict: "user_id,day_of_week" });

      if (error) throw error;

      toast({ title: "Hours saved", description: "Your business hours have been updated successfully." });
    } catch (error) {
      console.error("Error saving hours:", error);
      toast({ title: "Error", description: "Failed to save hours. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!deleteBlockId) return;
    try {
      const { error } = await supabase.from("blocked_time").delete().eq("id", deleteBlockId);
      if (error) throw error;
      toast({ title: "Block removed", description: "The blocked time has been removed." });
      setDeleteBlockId(null);
      loadAll();
    } catch (error) {
      console.error("Error deleting block:", error);
      toast({ title: "Error", description: "Failed to remove blocked time.", variant: "destructive" });
    }
  };

  const getStaffName = (staffId: string) => {
    if (staffId === userId) return "You (Owner)";
    const member = staffMembers.find(m => m.member_id === staffId);
    return member?.member_name || member?.email?.split("@")[0] || "Staff";
  };

  const getStaffAvatar = (staffId: string) => {
    const member = staffMembers.find(m => m.member_id === staffId);
    return member?.member_avatar || null;
  };

  const filteredBlocks = selectedStaffId
    ? blockedTimes.filter(b => b.staff_member_id === selectedStaffId)
    : blockedTimes;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Business Hours Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Business Hours</h3>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div>
            <Label className="font-medium">Show opening hours on public profile</Label>
            <p className="text-sm text-muted-foreground">When enabled, your hours will appear alongside your services</p>
          </div>
          <Switch checked={showOnProfile} onCheckedChange={handleToggleShowOnProfile} />
        </div>

        <div className="space-y-4">
          {hours.map(day => (
            <div key={day.day_of_week} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2 min-w-[120px]">
                <Switch checked={day.is_open} onCheckedChange={() => handleToggleDay(day.day_of_week)} />
                <Label className="font-medium text-sm">{day.day_of_week}</Label>
              </div>
              {day.is_open ? (
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <Input type="time" value={day.open_time} onChange={(e) => handleTimeChange(day.day_of_week, "open_time", e.target.value)} className="w-[120px] text-sm" />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input type="time" value={day.close_time} onChange={(e) => handleTimeChange(day.day_of_week, "close_time", e.target.value)} className="w-[120px] text-sm" />
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Closed</span>
              )}
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : "Save Hours"}
        </Button>
      </div>

      <Separator />

      {/* Staff Calendar / Blocked Time Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Staff Calendar</h3>
          </div>
          {userId && (
            <Button size="sm" onClick={() => setBlockDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Block Time
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Manage unavailable times for yourself and your team. Blocked times prevent customers from booking during those periods.
        </p>

        {/* Staff filter */}
        {staffMembers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStaffId === null ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setSelectedStaffId(null)}
            >
              All
            </Button>
            <Button
              variant={selectedStaffId === userId ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setSelectedStaffId(userId)}
            >
              You
            </Button>
            {staffMembers.filter(m => m.member_id && m.status === "accepted").map(member => (
              <Button
                key={member.id}
                variant={selectedStaffId === member.member_id ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setSelectedStaffId(member.member_id)}
              >
                {member.member_name || member.email?.split("@")[0]}
              </Button>
            ))}
          </div>
        )}

        {/* Blocked time list */}
        {filteredBlocks.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/30">
            <CalendarOff className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No blocked times</p>
            <p className="text-xs text-muted-foreground mt-1">Staff are available during all business hours</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBlocks.map(block => {
              const startDate = new Date(block.start_time);
              const endDate = new Date(block.end_time);
              const isAllDay = format(startDate, "HH:mm") === "00:00" && format(endDate, "HH:mm") === "23:59";
              const staffName = getStaffName(block.staff_member_id);
              const staffAvatar = getStaffAvatar(block.staff_member_id);

              return (
                <div key={block.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={staffAvatar || undefined} />
                    <AvatarFallback className="text-xs">{staffName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{staffName}</span>
                      {block.repeat_type !== "none" && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {block.repeat_type === "daily" ? "Daily" : block.repeat_type === "weekly" ? "Weekly" : "Custom"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(startDate, "MMM d, yyyy")} · {isAllDay ? "All day" : `${format(startDate, "HH:mm")} – ${format(endDate, "HH:mm")}`}
                      {block.reason && ` · ${block.reason}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteBlockId(block.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Block Time Dialog */}
      {userId && (
        <BlockTimeDialog
          open={blockDialogOpen}
          onOpenChange={setBlockDialogOpen}
          businessId={userId}
          onUpdate={loadAll}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBlockId} onOpenChange={(open) => !open && setDeleteBlockId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove blocked time?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make this time slot available for bookings again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBlock}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
