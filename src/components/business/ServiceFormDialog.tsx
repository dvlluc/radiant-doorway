import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { getCurrencyFromLocation } from "@/utils/currency";

interface ServiceCategory {
  id: string;
  name: string;
}

export interface ServiceFormService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  buffer_time: number;
  category_id?: string | null;
}

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingService?: ServiceFormService | null;
  onSaved: () => void | Promise<void>;
}

const emptyFormData = {
  name: "",
  description: "",
  price: "",
  duration: "",
  bufferTime: "",
  categoryId: "",
};

export function ServiceFormDialog({
  open,
  onOpenChange,
  editingService = null,
  onSaved,
}: ServiceFormDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyFormData);
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState({ symbol: "$", code: "USD" });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadBusinessLocation();
    loadCategories();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (editingService) {
      setFormData({
        name: editingService.name,
        description: editingService.description || "",
        price: editingService.price.toString(),
        duration: editingService.duration.toString(),
        bufferTime: editingService.buffer_time.toString(),
        categoryId: editingService.category_id || "",
      });
      return;
    }

    setFormData(emptyFormData);
  }, [open, editingService]);

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

      setCurrency(getCurrencyFromLocation(location));
    } catch (error) {
      console.error("Error loading business location:", error);
    }
  };

  const handleCreateCategory = async (rawName: string) => {
    const name = rawName.trim();
    if (!name) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
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

    setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setFormData((prev) => ({ ...prev, categoryId: data.id }));
    setCategorySearch("");
    setCategoryPopoverOpen(false);
    toast({ title: "Category created", description: `"${data.name}" is now selected.` });
  };

  const handleDeleteCategory = async (category: ServiceCategory) => {
    if (!confirm(`Delete category "${category.name}"? Services using it will become uncategorized.`)) return;

    const { error } = await supabase
      .from("service_categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      toast({ title: "Error", description: "Could not delete category.", variant: "destructive" });
      return;
    }

    setCategories((prev) => prev.filter((item) => item.id !== category.id));
    setFormData((prev) => (prev.categoryId === category.id ? { ...prev, categoryId: "" } : prev));
    toast({ title: "Category deleted" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.categoryId) {
        toast({
          title: "Category required",
          description: "Please select or create a service category.",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);

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
        const { error } = await supabase.from("services").insert(serviceData);
        if (error) throw error;
      }

      await onSaved();
      onOpenChange(false);
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
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
                    ? categories.find((category) => category.id === formData.categoryId)?.name || "Select category"
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
                        {categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            value={category.name}
                            onSelect={() => {
                              setFormData({ ...formData, categoryId: category.id });
                              setCategoryPopoverOpen(false);
                              setCategorySearch("");
                            }}
                            className="group"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.categoryId === category.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="flex-1">{category.name}</span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                handleDeleteCategory(category);
                              }}
                              className="ml-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={`Delete ${category.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {categorySearch.trim() &&
                      !categories.some(
                        (category) => category.name.toLowerCase() === categorySearch.trim().toLowerCase()
                      ) && (
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
                          <CommandItem disabled className="text-xs text-muted-foreground">
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
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              rows={3}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="duration" className="text-sm">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(event) => setFormData({ ...formData, duration: event.target.value })}
                required
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="price" className="text-sm">Price ({currency.symbol})</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(event) => setFormData({ ...formData, price: event.target.value })}
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
              onChange={(event) => setFormData({ ...formData, bufferTime: event.target.value })}
              placeholder="0"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Extra time for setup/cleanup between appointments
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="sm">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {editingService ? "Update" : "Add"} Service
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
