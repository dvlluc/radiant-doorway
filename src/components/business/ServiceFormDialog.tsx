import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Image, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BusinessCategoryMultiSelect } from "@/components/BusinessCategoryMultiSelect";
import { getCurrencyFromLocation } from "@/utils/currency";

interface PhotoItem {
  preview: string;
  file?: File;
  existingUrl?: string;
}

export interface ServiceFormService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  buffer_time: number;
  business_categories?: string[] | null;
  requirements?: string | null;
  image_urls?: string[] | null;
  image_url?: string | null;
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
  requirements: "",
  price: "",
  duration: "",
  bufferTime: "",
  businessCategories: [] as string[],
};

function getServicePhotoUrls(service: ServiceFormService): string[] {
  if (service.image_urls?.length) return service.image_urls;
  if (service.image_url) return [service.image_url];
  return [];
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  editingService = null,
  onSaved,
}: ServiceFormDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyFormData);
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState({ symbol: "$", code: "USD" });

  useEffect(() => {
    if (!open) return;
    loadBusinessLocation();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (editingService) {
      setFormData({
        name: editingService.name,
        description: editingService.description || "",
        requirements: editingService.requirements || "",
        price: editingService.price.toString(),
        duration: editingService.duration.toString(),
        bufferTime: editingService.buffer_time.toString(),
        businessCategories: editingService.business_categories || [],
      });
      setPhotoItems(
        getServicePhotoUrls(editingService).map((url) => ({
          preview: url,
          existingUrl: url,
        }))
      );
      return;
    }

    setFormData(emptyFormData);
    setPhotoItems([]);
  }, [open, editingService]);

  const resetPhotoItems = (items: PhotoItem[]) => {
    items.forEach((item) => {
      if (item.file) URL.revokeObjectURL(item.preview);
    });
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

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setPhotoItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        preview: URL.createObjectURL(file),
        file,
      })),
    ]);

    event.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotoItems((prev) => {
      const item = prev[index];
      if (item?.file) URL.revokeObjectURL(item.preview);
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const uploadPhotos = async (userId: string, items: PhotoItem[]) => {
    const urls: string[] = [];

    for (const item of items) {
      if (item.existingUrl) {
        urls.push(item.existingUrl);
        continue;
      }

      if (!item.file) continue;

      const ext = item.file.name.split(".").pop();
      const path = `${userId}/services/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("service-photos")
        .upload(path, item.file);

      if (error) throw error;

      const { data: publicUrl } = supabase.storage.from("service-photos").getPublicUrl(path);
      urls.push(publicUrl.publicUrl);
    }

    return urls;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (formData.businessCategories.length === 0) {
        toast({
          title: "Category required",
          description: "Please select at least one service category.",
          variant: "destructive",
        });
        return;
      }

      if (photoItems.length === 0) {
        toast({
          title: "Photo required",
          description: "Please upload at least one service photo.",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);

      const imageUrls = await uploadPhotos(user.id, photoItems);

      const serviceData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        requirements: formData.requirements.trim() || null,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        buffer_time: parseInt(formData.bufferTime) || 0,
        is_active: true,
        currency_code: currency.code,
        currency_symbol: currency.symbol,
        business_categories: formData.businessCategories,
        image_urls: imageUrls,
        image_url: imageUrls[0] || null,
        category_id: null,
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

      resetPhotoItems(photoItems.filter((item) => item.file));
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetPhotoItems(photoItems.filter((item) => item.file));
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {editingService ? "Edit Service" : "Add New Service"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Photo *</Label>
            {photoItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {photoItems.map((item, index) => (
                  <div key={`${item.preview}-${index}`} className="relative aspect-square">
                    <img
                      src={item.preview}
                      alt={`Service photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => document.getElementById("service-photo-input")?.click()}
                  className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                >
                  <Plus className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add more</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => document.getElementById("service-photo-input")?.click()}
                className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
              >
                <Image className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload</span>
              </button>
            )}
            <input
              id="service-photo-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="serviceCategory" className="text-sm">Service Category *</Label>
            <BusinessCategoryMultiSelect
              id="serviceCategory"
              value={formData.businessCategories}
              onChange={(businessCategories) => setFormData({ ...formData, businessCategories })}
            />
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

          <div>
            <Label htmlFor="requirements" className="text-sm">Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(event) => setFormData({ ...formData, requirements: event.target.value })}
              rows={2}
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
