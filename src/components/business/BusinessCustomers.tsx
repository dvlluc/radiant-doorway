import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Search, FileText, Download, Upload, Trash2, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface CustomerRecord {
  id: string;
  customer_id: string;
  notes: string | null;
  medical_conditions: string | null;
  special_requirements: string | null;
  customer_name: string;
  customer_email: string;
}

export const BusinessCustomers = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerNotes, setNewCustomerNotes] = useState("");
  const [newCustomerMedical, setNewCustomerMedical] = useState("");
  const [newCustomerRequirements, setNewCustomerRequirements] = useState("");
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("customer_records")
        .select(`
          *,
          profiles!customer_records_customer_id_fkey(first_name, last_name, email)
        `)
        .eq("business_id", user.id);

      if (error) throw error;

      const formattedData = data?.map((record: any) => ({
        ...record,
        customer_name: `${record.profiles?.first_name || ""} ${record.profiles?.last_name || ""}`.trim() || "Unknown",
        customer_email: record.profiles?.email || "",
      })) || [];

      setCustomers(formattedData);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from("customer_records")
        .update({
          notes: selectedCustomer.notes,
          medical_conditions: selectedCustomer.medical_conditions,
          special_requirements: selectedCustomer.special_requirements,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedCustomer.id);

      if (error) throw error;

      await loadCustomers();
      setIsDialogOpen(false);
      toast({
        title: "Notes saved",
        description: "Customer information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddCustomer = async () => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newCustomerEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a customer email address.",
        variant: "destructive",
      });
      return;
    }
    
    if (!emailRegex.test(newCustomerEmail.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCustomer(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find user by email
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("email", newCustomerEmail.trim().toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        toast({
          title: "User not found",
          description: "No user exists with this email address. They must have an account first.",
          variant: "destructive",
        });
        return;
      }

      // Check if customer record already exists
      const { data: existingRecord } = await supabase
        .from("customer_records")
        .select("id")
        .eq("business_id", user.id)
        .eq("customer_id", profileData.id)
        .maybeSingle();

      if (existingRecord) {
        toast({
          title: "Customer exists",
          description: "This customer is already in your records.",
          variant: "destructive",
        });
        return;
      }

      // Create customer record
      const { error: insertError } = await supabase
        .from("customer_records")
        .insert({
          business_id: user.id,
          customer_id: profileData.id,
          notes: newCustomerNotes.trim() || null,
          medical_conditions: newCustomerMedical.trim() || null,
          special_requirements: newCustomerRequirements.trim() || null,
        });

      if (insertError) throw insertError;

      await loadCustomers();
      setAddDialogOpen(false);
      setNewCustomerEmail("");
      setNewCustomerNotes("");
      setNewCustomerMedical("");
      setNewCustomerRequirements("");
      
      toast({
        title: "Customer added",
        description: `${profileData.first_name} ${profileData.last_name} has been added to your customer records.`,
      });
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const { error } = await supabase
        .from("customer_records")
        .delete()
        .eq("id", customerToDelete);

      if (error) throw error;

      await loadCustomers();
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      toast({
        title: "Customer deleted",
        description: "Customer record has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = () => {
    if (customers.length === 0) {
      toast({
        title: "No data",
        description: "No customer records to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const csvHeaders = ["Customer Name", "Email", "Notes", "Medical Conditions", "Special Requirements"];
      const csvRows = customers.map(customer => [
        customer.customer_name,
        customer.customer_email,
        customer.notes || "",
        customer.medical_conditions || "",
        customer.special_requirements || ""
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map(row => row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `customer-records-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report downloaded",
        description: `Exported ${customers.length} customer records successfully.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUploadCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const text = await file.text();
      const rows = text.split("\n").map(row => row.split(",").map(cell => cell.trim().replace(/^"|"$/g, "")));
      
      // Skip header row
      const dataRows = rows.slice(1).filter(row => row.length >= 2 && row[0] && row[1]);

      let successCount = 0;
      let errorCount = 0;

      for (const row of dataRows) {
        const [name, email, notes, medicalConditions, specialRequirements] = row;
        
        // Find customer by email
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (profileData) {
          // Check if record already exists
          const { data: existingRecord } = await supabase
            .from("customer_records")
            .select("id")
            .eq("business_id", user.id)
            .eq("customer_id", profileData.id)
            .maybeSingle();

          if (existingRecord) {
            // Update existing record
            const { error } = await supabase
              .from("customer_records")
              .update({
                notes: notes || null,
                medical_conditions: medicalConditions || null,
                special_requirements: specialRequirements || null,
              })
              .eq("id", existingRecord.id);

            if (error) {
              errorCount++;
            } else {
              successCount++;
            }
          } else {
            // Create new record
            const { error } = await supabase
              .from("customer_records")
              .insert({
                business_id: user.id,
                customer_id: profileData.id,
                notes: notes || null,
                medical_conditions: medicalConditions || null,
                special_requirements: specialRequirements || null,
              });

            if (error) {
              errorCount++;
            } else {
              successCount++;
            }
          }
        } else {
          errorCount++;
        }
      }

      await loadCustomers();

      toast({
        title: "Upload complete",
        description: `${successCount} records processed successfully. ${errorCount > 0 ? `${errorCount} failed.` : ""}`,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading CSV:", error);
      toast({
        title: "Error",
        description: "Failed to upload customer records. Please check your file format.",
        variant: "destructive",
      });
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Users className="h-5 w-5 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold">Customer Records</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1 sm:flex-none text-xs sm:text-sm"
            onClick={() => setAddDialogOpen(true)}
          >
            <UserPlus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Add Customer
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleUploadCSV}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
            onClick={() => fileInputRef.current?.click()}
            title="Upload CSV"
          >
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline sm:ml-2 text-xs sm:text-sm">Upload</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
            onClick={handleDownloadReport}
            disabled={customers.length === 0}
            title="Download Report"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline sm:ml-2 text-xs sm:text-sm">Download</span>
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-sm"
        />
      </div>

      <div className="space-y-2">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm sm:text-base truncate">{customer.customer_name}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{customer.customer_email}</p>
              {customer.notes && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">
                  Notes: {customer.notes}
                </p>
              )}
            </div>

            <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                onClick={() => {
                  setSelectedCustomer(customer);
                  setIsDialogOpen(true);
                }}
              >
                <FileText className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">View</span>
                <span className="xs:hidden">View</span>
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setCustomerToDelete(customer.id);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="text-center p-6 sm:p-8 border-2 border-dashed rounded-lg">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm sm:text-base text-muted-foreground">
              {searchTerm ? "No customers found" : "No customer records yet"}
            </p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg truncate">
              Customer: {selectedCustomer?.customer_name}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes" className="text-sm">Notes</Label>
                <Textarea
                  id="notes"
                  className="text-sm"
                  value={selectedCustomer.notes || ""}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, notes: e.target.value })}
                  rows={4}
                  placeholder="Add general notes about this customer..."
                />
              </div>

              <div>
                <Label htmlFor="medical" className="text-sm">Medical Conditions</Label>
                <Textarea
                  id="medical"
                  className="text-sm"
                  value={selectedCustomer.medical_conditions || ""}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, medical_conditions: e.target.value })}
                  rows={3}
                  placeholder="List any medical conditions or allergies..."
                />
              </div>

              <div>
                <Label htmlFor="requirements" className="text-sm">Special Requirements</Label>
                <Textarea
                  id="requirements"
                  className="text-sm"
                  value={selectedCustomer.special_requirements || ""}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, special_requirements: e.target.value })}
                  rows={3}
                  placeholder="Note any special requirements or preferences..."
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNotes}>
                  Save Notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-email" className="text-sm">Customer Email Address *</Label>
              <Input
                id="customer-email"
                type="email"
                className="text-sm"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                maxLength={255}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                The customer must already have an account on the platform
              </p>
            </div>

            <div>
              <Label htmlFor="add-notes" className="text-sm">Notes (Optional)</Label>
              <Textarea
                id="add-notes"
                className="text-sm"
                value={newCustomerNotes}
                onChange={(e) => setNewCustomerNotes(e.target.value)}
                rows={3}
                placeholder="Add general notes about this customer..."
                maxLength={1000}
              />
            </div>

            <div>
              <Label htmlFor="add-medical" className="text-sm">Medical Conditions (Optional)</Label>
              <Textarea
                id="add-medical"
                className="text-sm"
                value={newCustomerMedical}
                onChange={(e) => setNewCustomerMedical(e.target.value)}
                rows={3}
                placeholder="List any medical conditions or allergies..."
                maxLength={1000}
              />
            </div>

            <div>
              <Label htmlFor="add-requirements" className="text-sm">Special Requirements (Optional)</Label>
              <Textarea
                id="add-requirements"
                className="text-sm"
                value={newCustomerRequirements}
                onChange={(e) => setNewCustomerRequirements(e.target.value)}
                rows={3}
                placeholder="Note any special requirements or preferences..."
                maxLength={1000}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddDialogOpen(false);
                  setNewCustomerEmail("");
                  setNewCustomerNotes("");
                  setNewCustomerMedical("");
                  setNewCustomerRequirements("");
                }}
                disabled={isAddingCustomer}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleAddCustomer}
                disabled={isAddingCustomer}
              >
                {isAddingCustomer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};