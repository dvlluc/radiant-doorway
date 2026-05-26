import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Scissors, Percent, Check, ChevronsUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { getCurrencyFromLocation } from "@/utils/currency";

interface ServiceCategory {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  buffer_time: number;
  is_active: boolean;
  discount_percentage: number | null;
  original_price: number | null;
  discount_active: boolean;
  currency_code?: string;
  currency_symbol?: string;
  category_id?: string | null;
}

export const BusinessServices = () => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [currency, setCurrency] = useState({ symbol: "$", code: "USD" });
  const { toast } = useToast();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    bufferTime: "",
    categoryId: "",
  });

  useEffect(() => {
    loadBusinessLocation();
    loadServices();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("service_categories")
      .select("id, name")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });
    if (!error && data) setCategories(data);
  };

  const handleCreateCategory = async (rawName: string) => {
    const name = rawName.trim();
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast({ title: "Category already exists", variant: "destructive" });
      return;
    }

    setCreatingCategory(true);
    const { data, error } = await supabase
      .from("service_categories")
      .insert({ user_id: user.id, name })
      .select("id, name")
      .single();
    setCreatingCategory(false);

    if (error || !data) {
      toast({ title: "Error", description: "Could not create category.", variant: "destructive" });
      return;
    }

    setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setFormData(prev => ({ ...prev, categoryId: data.id }));
    setCategorySearch("");
    setCategoryPopoverOpen(false);
    toast({ title: "Category created", description: `"${data.name}" is now selected.` });
  };

  const handleDeleteCategory = async (cat: ServiceCategory) => {
    if (!confirm(`Delete category "${cat.name}"? Services using it will become uncategorized.`)) return;
    const { error } = await supabase
      .from("service_categories")
      .delete()
      .eq("id", cat.id);
    if (error) {
      toast({ title: "Error", description: "Could not delete category.", variant: "destructive" });
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== cat.id));
    setFormData(prev => prev.categoryId === cat.id ? { ...prev, categoryId: "" } : prev);
    toast({ title: "Category deleted" });
  };

  const loadBusinessLocation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("account_type")
        .eq("user_id", user.id)
        .single();

      if (!roleData) return;

      let location = "";

      if (roleData.account_type === "business") {
        const { data } = await supabase
          .from("business_profiles")
          .select("address")
          .eq("user_id", user.id)
          .single();
        location = data?.address || "";
      } else if (roleData.account_type === "brand") {
        const { data } = await supabase
          .from("brand_profiles")
          .select("address")
          .eq("user_id", user.id)
          .single();
        location = data?.address || "";
      } else if (roleData.account_type === "charitable_partner") {
        const { data } = await supabase
          .from("charitable_profiles")
          .select("address")
          .eq("user_id", user.id)
          .single();
        location = data?.address || "";
      }

      const detectedCurrency = getCurrencyFromLocation(location);
      setCurrency(detectedCurrency);
    } catch (error) {
      console.error("Error loading business location:", error);
    }
  };

  const loadServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, price, duration, buffer_time, is_active, discount_percentage, original_price, discount_active, currency_code, currency_symbol, category_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Update any services with mismatched currency to use business currency
      if (data && data.length > 0) {
        const servicesToUpdate = data.filter(
          service => service.currency_code !== currency.code || service.currency_symbol !== currency.symbol
        );
        
        if (servicesToUpdate.length > 0) {
          const updates = servicesToUpdate.map(service =>
            supabase
              .from("services")
              .update({
                currency_code: currency.code,
                currency_symbol: currency.symbol,
              })
              .eq("id", service.id)
          );
          
          await Promise.all(updates);
          
          // Reload to get updated data
          const { data: updatedData } = await supabase
            .from("services")
            .select("id, name, description, price, duration, buffer_time, is_active, discount_percentage, original_price, discount_active, currency_code, currency_symbol, category_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          
          setServices(updatedData || []);
        } else {
          setServices(data);
        }
      }
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.categoryId) {
        toast({ title: "Category required", description: "Please select or create a service category.", variant: "destructive" });
        return;
      }

      const serviceData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        buffer_time: parseInt(formData.bufferTime) || 0,
        is_active: true,
        currency_code: currency.code,
        currency_symbol: currency.symbol,
        category_id: formData.categoryId,
      };

      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", editingService.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("services")
          .insert(serviceData);

        if (error) throw error;
      }

      await loadServices();
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingService ? "Service updated" : "Service added",
        description: "Your service has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving service:", error);
      toast({
        title: "Error",
        description: "Failed to save service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      duration: service.duration.toString(),
      bufferTime: service.buffer_time.toString(),
      categoryId: service.category_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadServices();
      toast({
        title: "Service deleted",
        description: "The service has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      duration: "",
      bufferTime: "",
      categoryId: "",
    });
    setEditingService(null);
  };

  const handleOpenDiscountDialog = (service: Service) => {
    setSelectedService(service);
    setDiscountPercentage(service.discount_percentage?.toString() || "");
    setDiscountDialogOpen(true);
  };

  const handleApplyDiscount = async () => {
    if (!selectedService) return;
    
    const discountValue = parseFloat(discountPercentage);
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      toast({
        title: "Invalid discount",
        description: "Please enter a discount between 0 and 100%.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentPrice = selectedService.discount_active 
        ? selectedService.original_price 
        : selectedService.price;
      
      const discountedPrice = currentPrice! * (1 - discountValue / 100);

      const { error } = await supabase
        .from("services")
        .update({
          discount_percentage: discountValue,
          original_price: currentPrice,
          discount_active: true,
          price: discountedPrice,
        })
        .eq("id", selectedService.id);

      if (error) throw error;

      await loadServices();
      setDiscountDialogOpen(false);
      setDiscountPercentage("");
      toast({
        title: "Discount applied",
        description: `${discountValue}% discount has been applied to the service.`,
      });
    } catch (error) {
      console.error("Error applying discount:", error);
      toast({
        title: "Error",
        description: "Failed to apply discount. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveDiscount = async (service: Service) => {
    try {
      const { error } = await supabase
        .from("services")
        .update({
          discount_percentage: null,
          discount_active: false,
          price: service.original_price,
          original_price: null,
        })
        .eq("id", service.id);

      if (error) throw error;

      await loadServices();
      toast({
        title: "Discount removed",
        description: "The discount has been removed from the service.",
      });
    } catch (error) {
      console.error("Error removing discount:", error);
      toast({
        title: "Error",
        description: "Failed to remove discount. Please try again.",
        variant: "destructive",
      });
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Scissors className="h-5 w-5 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold">Services</h3>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                {editingService ? "Edit Service" : "Add New Service"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-sm">Service Category</Label>
                <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between text-sm font-normal",
                        !formData.categoryId && "text-muted-foreground"
                      )}
                    >
                      {formData.categoryId
                        ? categories.find(c => c.id === formData.categoryId)?.name || "Select category"
                        : "Select or create a category"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search category..."
                        value={categorySearch}
                        onValueChange={setCategorySearch}
                      />
                      <CommandList>
                        <CommandEmpty>No categories yet.</CommandEmpty>
                        {categories.length > 0 && (
                          <CommandGroup>
                            {categories.map(cat => (
                              <CommandItem
                                key={cat.id}
                                value={cat.name}
                                onSelect={() => {
                                  setFormData({ ...formData, categoryId: cat.id });
                                  setCategoryPopoverOpen(false);
                                  setCategorySearch("");
                                }}
                                className="group"
                              >
                                <Check className={cn("mr-2 h-4 w-4", formData.categoryId === cat.id ? "opacity-100" : "opacity-0")} />
                                <span className="flex-1">{cat.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleDeleteCategory(cat);
                                  }}
                                  className="ml-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label={`Delete ${cat.name}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {categorySearch.trim() &&
                          !categories.some(c => c.name.toLowerCase() === categorySearch.trim().toLowerCase()) && (
                          <>
                            <CommandSeparator />
                            <CommandGroup>
                              <CommandItem
                                disabled={creatingCategory}
                                onSelect={() => handleCreateCategory(categorySearch)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add new category "{categorySearch.trim()}"
                              </CommandItem>
                            </CommandGroup>
                          </>
                        )}
                        {!categorySearch.trim() && (
                          <>
                            <CommandSeparator />
                            <CommandGroup>
                              <CommandItem
                                disabled
                                className="text-xs text-muted-foreground"
                              >
                                Type a name above to add a new category
                              </CommandItem>
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="price" className="text-sm">Price ({currency.symbol})</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="duration" className="text-sm">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bufferTime" className="text-sm">Buffer Time (minutes)</Label>
                <Input
                  id="bufferTime"
                  type="number"
                  min="0"
                  value={formData.bufferTime}
                  onChange={(e) => setFormData({ ...formData, bufferTime: e.target.value })}
                  placeholder="0"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Extra time for setup/cleanup between appointments
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} size="sm">
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editingService ? "Update" : "Add"} Service
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {services.map(service => (
          <div key={service.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm sm:text-base truncate">{service.name}</h4>
              {service.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{service.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                {service.discount_active && service.original_price ? (
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <span className="line-through text-muted-foreground">
                      {currency.symbol}{service.original_price.toFixed(2)}
                    </span>
                    <span className="font-semibold text-accent">
                      {currency.symbol}{service.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] sm:text-xs bg-accent/20 text-accent px-1.5 sm:px-2 py-0.5 rounded">
                      {service.discount_percentage}% OFF
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {currency.symbol}{service.price.toFixed(2)}
                  </span>
                )}
                <span className="text-muted-foreground hidden sm:inline">•</span>
                <span className="text-muted-foreground">{service.duration} min</span>
                {service.buffer_time > 0 && (
                  <>
                    <span className="text-muted-foreground hidden sm:inline">•</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">+{service.buffer_time}min buffer</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-center flex-shrink-0">
              {service.discount_active ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => handleRemoveDiscount(service)}
                  title="Remove discount"
                >
                  <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => handleOpenDiscountDialog(service)}
                  title="Add discount"
                >
                  <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => handleEdit(service)}
              >
                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => handleDelete(service.id)}
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <div className="text-center p-6 sm:p-8 border-2 border-dashed rounded-lg">
            <Scissors className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm sm:text-base text-muted-foreground">No services added yet</p>
          </div>
        )}
      </div>

      {/* Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="discount">Discount Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  placeholder="Enter discount %"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter a percentage between 0 and 100
              </p>
            </div>

            {selectedService && discountPercentage && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Preview:</p>
                <div className="flex items-center gap-2">
                  <span className="line-through text-muted-foreground">
                    {selectedService.currency_symbol || currency.symbol}
                    {(selectedService.discount_active 
                      ? selectedService.original_price! 
                      : selectedService.price).toFixed(2)}
                  </span>
                  <span className="font-semibold text-accent">
                    {selectedService.currency_symbol || currency.symbol}
                    {((selectedService.discount_active 
                      ? selectedService.original_price! 
                      : selectedService.price) * 
                    (1 - parseFloat(discountPercentage) / 100)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDiscountDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleApplyDiscount}>
                Apply Discount
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};