import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPhoneForTwilio, formatPhoneInput } from "@/utils/phoneFormat";

interface Service {
  id: string;
  name: string;
  staff_ids: string[] | null;
}

interface EditStaffMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    email: string;
    role: string;
    title?: string;
    phone?: string;
    specialties?: string;
    bio?: string;
  };
  onUpdate: () => void;
}

export function EditStaffMemberDialog({ open, onOpenChange, member, onUpdate }: EditStaffMemberDialogProps) {
  const [title, setTitle] = useState(member.title || "");
  const [role, setRole] = useState(member.role || "staff");
  const [phone, setPhone] = useState(member.phone || "");
  const [bio, setBio] = useState(member.bio || "");
  const [loading, setLoading] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadServices();
      loadMemberServices();
    }
  }, [open, member.id]);

  const loadServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;
      setAvailableServices(data || []);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const loadMemberServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("id")
        .contains("staff_ids", [member.id]);

      if (error) throw error;
      setSelectedServices(data?.map(s => s.id) || []);
    } catch (error) {
      console.error("Error loading member services:", error);
    }
  };

  const handleAddService = () => {
    if (selectedServiceToAdd && !selectedServices.includes(selectedServiceToAdd)) {
      setSelectedServices([...selectedServices, selectedServiceToAdd]);
      setSelectedServiceToAdd("");
    }
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(id => id !== serviceId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update team member info
      const { error: memberError } = await supabase
        .from("team_members")
        .update({
          title,
          role,
          phone: formatPhoneForTwilio(phone),
          bio: bio || null,
        })
        .eq("id", member.id);

      if (memberError) throw memberError;

      // Get all services for this business
      const { data: allServices, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", user.id);

      if (servicesError) throw servicesError;

      // Update each service's staff_ids array
      for (const service of allServices || []) {
        const currentStaffIds = service.staff_ids || [];
        const shouldIncludeStaff = selectedServices.includes(service.id);
        const currentlyIncluded = currentStaffIds.includes(member.id);

        if (shouldIncludeStaff && !currentlyIncluded) {
          // Add staff to this service
          const { error: updateError } = await supabase
            .from("services")
            .update({ staff_ids: [...currentStaffIds, member.id] })
            .eq("id", service.id);

          if (updateError) throw updateError;
        } else if (!shouldIncludeStaff && currentlyIncluded) {
          // Remove staff from this service
          const { error: updateError } = await supabase
            .from("services")
            .update({ staff_ids: currentStaffIds.filter(id => id !== member.id) })
            .eq("id", service.id);

          if (updateError) throw updateError;
        }
      }

      toast({
        title: "Staff member updated",
        description: "Staff member information and services have been updated successfully.",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating staff member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            Update staff member information and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={member.email} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Staff, Manager"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Senior Hair Stylist"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                const formatted = formatPhoneInput(e.target.value);
                setPhone(formatted);
              }}
              placeholder="+1 (302) 538-9413"
            />
            <p className="text-xs text-muted-foreground">
              Format: +1 (XXX) XXX-XXXX
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Short Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A brief description of this professional's expertise..."
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">{bio.length}/300 characters</p>
          </div>

          <div className="space-y-2">
            <Label>Services</Label>
            <div className="flex gap-2">
              <Select value={selectedServiceToAdd} onValueChange={setSelectedServiceToAdd}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {availableServices
                    .filter(service => !selectedServices.includes(service.id))
                    .map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddService}
                disabled={!selectedServiceToAdd}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedServices.map((serviceId) => {
                const service = availableServices.find(s => s.id === serviceId);
                return service ? (
                  <Badge key={serviceId} variant="secondary" className="flex items-center gap-1">
                    {service.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveService(serviceId)}
                      className="ml-1 hover:bg-destructive/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              Update Staff Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
