import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const BusinessGeneralSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointmentBookingEnabled, setAppointmentBookingEnabled] = useState(false);
  const [aboutUs, setAboutUs] = useState("");
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState<number>(25);
  const [refundPolicyHours, setRefundPolicyHours] = useState<number>(24);
  const [isSoloBusiness, setIsSoloBusiness] = useState<boolean>(true);
  const { toast } = useToast();

  const presetPercentages = [10, 20, 30, 50];

  useEffect(() => {
    const init = async () => {
      await loadSettings();
      await loadProfile();
      await loadStaffCount();
    };
    init();
  }, []);

  const loadStaffCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await (supabase as any)
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("status", "terminated");
      const solo = (count ?? 0) === 0;
      setIsSoloBusiness(solo);
      // Multi-staff businesses: deposits are mandatory
      if (!solo) setDepositEnabled(true);
    } catch (e) {
      console.error("Error loading staff count:", e);
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("account_type")
        .eq("user_id", user.id)
        .maybeSingle();

      const accountType = roleData?.account_type;

      if (accountType === "business") {
        const { data } = await supabase
          .from("business_profiles")
          .select("about_us")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) setAboutUs(data.about_us || "");
      } else if (accountType === "brand") {
        const { data } = await supabase
          .from("brand_profiles")
          .select("about_us")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) setAboutUs(data.about_us || "");
      } else if (accountType === "charitable_partner") {
        const { data } = await supabase
          .from("charitable_profiles")
          .select("about_us")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) setAboutUs(data.about_us || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAppointmentBookingEnabled(data.appointment_booking_enabled);
        setDepositEnabled((data as any).deposit_enabled ?? false);
        setDepositPercentage(Number((data as any).deposit_percentage ?? 25));
        setRefundPolicyHours(Number((data as any).refund_policy_hours ?? 24));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: settingsError } = await supabase
        .from("business_settings")
        .upsert({
          user_id: user.id,
          appointment_booking_enabled: appointmentBookingEnabled,
          deposit_enabled: depositEnabled,
          deposit_percentage: depositPercentage,
          refund_policy_hours: refundPolicyHours,
          updated_at: new Date().toISOString(),
        } as any, {
          onConflict: 'user_id'
        });

      if (settingsError) throw settingsError;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("account_type")
        .eq("user_id", user.id)
        .maybeSingle();

      const accountType = roleData?.account_type;

      if (accountType === "business") {
        const { error } = await supabase
          .from("business_profiles")
          .update({ about_us: aboutUs })
          .eq("user_id", user.id);
        if (error) throw error;
      } else if (accountType === "brand") {
        const { error } = await supabase
          .from("brand_profiles")
          .update({ about_us: aboutUs })
          .eq("user_id", user.id);
        if (error) throw error;
      } else if (accountType === "charitable_partner") {
        const { error } = await supabase
          .from("charitable_profiles")
          .update({ about_us: aboutUs })
          .eq("user_id", user.id);
        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Your general settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">General Settings</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="about-us">About Us</Label>
            <Input
              id="about-us"
              type="text"
              placeholder="Brief description about your business (max 80 characters)"
              value={aboutUs}
              onChange={(e) => setAboutUs(e.target.value.slice(0, 80))}
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground">
              {aboutUs.length}/80 characters
            </p>
          </div>

          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="appointment-booking">
                Appointment Booking Platform
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable customers to book appointments through your profile
              </p>
            </div>
            <Switch
              id="appointment-booking"
              checked={appointmentBookingEnabled}
              onCheckedChange={setAppointmentBookingEnabled}
            />
          </div>
        </div>
      </div>

      {/* Deposit & Refund Policy */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Deposit Settings</h3>

        {isSoloBusiness ? (
          <div className="p-4 border rounded-lg bg-muted/40">
            <p className="text-sm font-medium mb-1">Solo business — no deposit required</p>
            <p className="text-sm text-muted-foreground">
              Because you're the only person taking bookings, your customers can book for free and pay in full at the venue.
              Deposit settings unlock automatically once you add a team member.
            </p>
          </div>
        ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-0.5 flex-1">
              <Label>Deposit Payments Required</Label>
              <p className="text-sm text-muted-foreground">
                Businesses with team members must collect a deposit at checkout. A 4.5% service fee plus card processing fees are added on top of the deposit and paid by the customer.
              </p>
            </div>
          </div>

          {depositEnabled && (
            <div className="p-4 border rounded-lg space-y-4">
              <div className="space-y-2">
                <Label>Deposit Percentage</Label>
                <div className="flex flex-wrap gap-2">
                  {presetPercentages.map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={depositPercentage === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDepositPercentage(p)}
                    >
                      {p}%
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Label htmlFor="custom-deposit" className="text-sm text-muted-foreground whitespace-nowrap">
                    Custom:
                  </Label>
                  <Input
                    id="custom-deposit"
                    type="number"
                    min={1}
                    max={100}
                    value={depositPercentage}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(100, Number(e.target.value) || 0));
                      setDepositPercentage(v);
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                <p className="font-medium mb-1">Customer pays at checkout (£200 booking)</p>
                {(() => {
                  const dep = +(200 * depositPercentage / 100).toFixed(2);
                  const fee = +(dep * 0.045).toFixed(2);
                  const sub = dep + fee;
                  const proc = +((sub + 0.30) / (1 - 0.029) - sub).toFixed(2);
                  const due = +(dep + fee + proc).toFixed(2);
                  return (
                    <>
                      <div className="flex justify-between"><span>Deposit ({depositPercentage}%):</span><span className="font-semibold">£{dep.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Service fee (4.5%):</span><span className="font-semibold">£{fee.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Processing fee:</span><span className="font-semibold">£{proc.toFixed(2)}</span></div>
                      <div className="flex justify-between border-t pt-1 mt-1"><span>Charged today:</span><span className="font-semibold">£{due.toFixed(2)}</span></div>
                      <div className="flex justify-between text-muted-foreground"><span>Remaining at venue:</span><span>£{(200 - dep).toFixed(2)}</span></div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="p-4 border rounded-lg space-y-2">
            <Label htmlFor="refund-policy">Refund Policy</Label>
            <p className="text-sm text-muted-foreground">
              Cancellation cutoff before the booking date
            </p>
            <Select
              value={String(refundPolicyHours)}
              onValueChange={(v) => setRefundPolicyHours(Number(v))}
            >
              <SelectTrigger id="refund-policy" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 Hours</SelectItem>
                <SelectItem value="48">48 Hours</SelectItem>
                <SelectItem value="72">72 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );
};
