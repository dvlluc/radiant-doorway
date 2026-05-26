import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldBan, X, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface RestrictedCustomer {
  id: string;
  customer_id: string;
  reason: string | null;
  restriction_type: string;
  restricted_until: string | null;
  customer_name: string;
  customer_email: string;
}

export const BusinessRestrictedList = () => {
  const [loading, setLoading] = useState(true);
  const [restricted, setRestricted] = useState<RestrictedCustomer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [restrictionType, setRestrictionType] = useState("30_days");
  const { toast } = useToast();

  useEffect(() => {
    loadRestrictedCustomers();
  }, []);

  const loadRestrictedCustomers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("restricted_customers")
        .select(`
          *,
          profiles!restricted_customers_customer_id_fkey(first_name, last_name, email)
        `)
        .eq("business_id", user.id);

      if (error) throw error;

      const formattedData = data?.map((record: any) => ({
        ...record,
        customer_name: `${record.profiles?.first_name || ""} ${record.profiles?.last_name || ""}`.trim() || "Unknown",
        customer_email: record.profiles?.email || "",
      })) || [];

      setRestricted(formattedData);
    } catch (error) {
      console.error("Error loading restricted customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestriction = async () => {
    if (!selectedCustomerId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const restrictedUntil = restrictionType === "indefinite" 
        ? null 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from("restricted_customers")
        .insert({
          business_id: user.id,
          customer_id: selectedCustomerId,
          reason: reason || null,
          restriction_type: restrictionType,
          restricted_until: restrictedUntil,
        });

      if (error) throw error;

      await loadRestrictedCustomers();
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Customer restricted",
        description: "The customer has been added to the restricted list.",
      });
    } catch (error) {
      console.error("Error adding restriction:", error);
      toast({
        title: "Error",
        description: "Failed to add restriction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveRestriction = async (id: string) => {
    try {
      const { error } = await supabase
        .from("restricted_customers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadRestrictedCustomers();
      toast({
        title: "Restriction removed",
        description: "The customer can now book appointments again.",
      });
    } catch (error) {
      console.error("Error removing restriction:", error);
      toast({
        title: "Error",
        description: "Failed to remove restriction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const searchCustomer = async () => {
    if (!searchEmail.trim()) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", searchEmail.trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSelectedCustomerId(data.id);
        toast({
          title: "Customer found",
          description: "You can now add them to the restricted list.",
        });
      } else {
        toast({
          title: "Customer not found",
          description: "No customer found with that email address.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching customer:", error);
      toast({
        title: "Error",
        description: "Failed to search for customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSearchEmail("");
    setSelectedCustomerId("");
    setReason("");
    setRestrictionType("30_days");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldBan className="h-4 w-4 sm:h-5 sm:w-5" />
          <h3 className="text-base sm:text-lg font-semibold">Restricted List</h3>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Plus className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              Add Restriction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Add Customer to Restricted List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search-email" className="text-sm">Customer Email</Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
                  <Input
                    id="search-email"
                    type="email"
                    placeholder="customer@example.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="text-sm"
                  />
                  <Button onClick={searchCustomer} variant="outline" size="sm" className="w-full sm:w-auto">
                    Search
                  </Button>
                </div>
              </div>

              {selectedCustomerId && (
                <>
                  <div>
                    <Label htmlFor="restriction-type" className="text-sm">Restriction Duration</Label>
                    <Select value={restrictionType} onValueChange={setRestrictionType}>
                      <SelectTrigger className="mt-1.5 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30_days">30 Days</SelectItem>
                        <SelectItem value="indefinite">Indefinite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reason" className="text-sm">Reason (optional)</Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason for restriction..."
                      rows={3}
                      className="mt-1.5 text-sm"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddRestriction} className="w-full sm:w-auto">
                      Add to Restricted List
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {restricted.map(customer => (
          <div key={customer.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 border rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h4 className="font-medium text-sm sm:text-base truncate">{customer.customer_name}</h4>
                <Badge 
                  variant={customer.restriction_type === "indefinite" ? "destructive" : "secondary"}
                  className="text-[10px] sm:text-xs"
                >
                  {customer.restriction_type === "indefinite" ? "Indefinite" : "30 Days"}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{customer.customer_email}</p>
              {customer.reason && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                  Reason: {customer.reason}
                </p>
              )}
              {customer.restricted_until && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Until: {new Date(customer.restricted_until).toLocaleDateString()}
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 self-end sm:self-auto"
              onClick={() => handleRemoveRestriction(customer.id)}
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        ))}

        {restricted.length === 0 && (
          <div className="text-center p-6 sm:p-8 border-2 border-dashed rounded-lg">
            <ShieldBan className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm sm:text-base text-muted-foreground">No restricted customers</p>
          </div>
        )}
      </div>
    </div>
  );
};