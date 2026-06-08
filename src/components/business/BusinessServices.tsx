import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Scissors, Percent } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCurrencyFromLocation } from "@/utils/currency";
import { ServiceFormDialog, type ServiceFormService } from "./ServiceFormDialog";
import { ServiceCardPhoto, ServicePhotosPreviewDialog } from "./ServicePhotosPreview";
import { getServicePhotoUrls } from "@/lib/servicePhotos";
import { roundDiscountedPrice, formatDiscountedServicePrice } from "@/lib/servicePrice";

interface Service extends ServiceFormService {
  is_active: boolean;
  discount_percentage: number | null;
  original_price: number | null;
  discount_active: boolean;
  currency_code?: string;
  currency_symbol?: string;
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
  const [servicePhotoPreview, setServicePhotoPreview] = useState<{
    photos: string[];
    title: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBusinessLocation();
    loadServices();
  }, []);

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
        .select("id, name, description, price, duration, buffer_time, is_active, discount_percentage, original_price, discount_active, currency_code, currency_symbol, business_categories, requirements, image_urls, image_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
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
          
          const { data: updatedData } = await supabase
            .from("services")
            .select("id, name, description, price, duration, buffer_time, is_active, discount_percentage, original_price, discount_active, currency_code, currency_symbol, business_categories, requirements, image_urls, image_url")
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

  const handleEdit = (service: Service) => {
    setEditingService(service);
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
      
      const discountedPrice = roundDiscountedPrice(currentPrice! * (1 - discountValue / 100));

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

        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => {
            setEditingService(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <ServiceFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingService(null);
        }}
        editingService={editingService}
        onSaved={loadServices}
      />

      <ServicePhotosPreviewDialog
        open={!!servicePhotoPreview}
        onOpenChange={(open) => {
          if (!open) setServicePhotoPreview(null);
        }}
        photos={servicePhotoPreview?.photos || []}
        title={servicePhotoPreview?.title}
      />

      <div className="space-y-2">
        {services.map(service => {
          const servicePhotos = getServicePhotoUrls(service);

          return (
          <div key={service.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 border rounded-lg gap-3">
            <div className="flex min-w-0 flex-1 gap-3">
              <ServiceCardPhoto
                photos={servicePhotos}
                alt={service.name}
                onPreview={() => setServicePhotoPreview({
                  photos: servicePhotos,
                  title: service.name,
                })}
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm sm:text-base truncate">{service.name}</h4>
                {service.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                )}
                {service.requirements && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    <span className="font-medium text-foreground">Requirements:</span> {service.requirements}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                  {service.discount_active && service.original_price ? (
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="line-through text-muted-foreground">
                        {formatDiscountedServicePrice(service.original_price, currency.symbol)}
                      </span>
                      <span className="font-semibold text-accent">
                        {formatDiscountedServicePrice(service.price, currency.symbol)}
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
          );
        })}

        {services.length === 0 && (
          <div className="text-center p-6 sm:p-8 border-2 border-dashed rounded-lg">
            <Scissors className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm sm:text-base text-muted-foreground">No services added yet</p>
          </div>
        )}
      </div>

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
                    {formatDiscountedServicePrice(
                      selectedService.discount_active
                        ? selectedService.original_price!
                        : selectedService.price,
                      selectedService.currency_symbol || currency.symbol
                    )}
                  </span>
                  <span className="font-semibold text-accent">
                    {formatDiscountedServicePrice(
                      (selectedService.discount_active
                        ? selectedService.original_price!
                        : selectedService.price) *
                        (1 - parseFloat(discountPercentage) / 100),
                      selectedService.currency_symbol || currency.symbol
                    )}
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
