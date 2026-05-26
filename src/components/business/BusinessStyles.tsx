import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface StyleItem {
  id: string;
  style_name: string;
  category: string;
  photo_url: string;
  description: string | null;
  services_required: string[];
  estimated_time: number | null;
  estimated_price: number | null;
  location: string | null;
}

const categoryOptions = [
  { value: "hair", label: "Hairstyles" },
  { value: "braids", label: "Braids" },
  { value: "barber", label: "Barber" },
  { value: "nails", label: "Nails" },
  { value: "makeup", label: "Makeup" },
  { value: "lashes", label: "Lashes" },
];

export function BusinessStyles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [styles, setStyles] = useState<StyleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<StyleItem | null>(null);

  // Form state
  const [styleName, setStyleName] = useState("");
  const [category, setCategory] = useState("hair");
  const [description, setDescription] = useState("");
  const [servicesRequired, setServicesRequired] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchStyles();
  }, [user]);

  const fetchStyles = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("styles")
      .select("*")
      .eq("professional_id", user.id)
      .order("created_at", { ascending: false });
    setStyles(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setStyleName("");
    setCategory("hair");
    setDescription("");
    setServicesRequired("");
    setEstimatedTime("");
    setEstimatedPrice("");
    setPhotoFile(null);
    setPhotoPreview("");
    setEditingStyle(null);
  };

  const openEdit = (style: StyleItem) => {
    setEditingStyle(style);
    setStyleName(style.style_name);
    setCategory(style.category);
    setDescription(style.description || "");
    setServicesRequired(style.services_required.join(", "));
    setEstimatedTime(style.estimated_time?.toString() || "");
    setEstimatedPrice(style.estimated_price?.toString() || "");
    setPhotoPreview(style.photo_url);
    setDialogOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || !styleName.trim()) return;
    if (!editingStyle && !photoFile) {
      toast({ title: "Please upload a photo", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    let photoUrl = editingStyle?.photo_url || "";

    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("style-photos")
        .upload(path, photoFile);
      if (uploadError) {
        toast({ title: "Failed to upload photo", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const { data: publicUrl } = supabase.storage.from("style-photos").getPublicUrl(path);
      photoUrl = publicUrl.publicUrl;
    }

    // Get business location
    const { data: biz } = await supabase
      .from("business_profiles")
      .select("address")
      .eq("user_id", user.id)
      .single();

    const payload = {
      style_name: styleName.trim(),
      category,
      photo_url: photoUrl,
      description: description.trim() || null,
      services_required: servicesRequired.split(",").map(s => s.trim()).filter(Boolean),
      estimated_time: estimatedTime ? parseInt(estimatedTime) : null,
      estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
      location: biz?.address || null,
      professional_id: user.id,
    };

    if (editingStyle) {
      const { error } = await supabase.from("styles").update(payload).eq("id", editingStyle.id);
      if (error) {
        toast({ title: "Failed to update style", variant: "destructive" });
      } else {
        toast({ title: "Style updated" });
      }
    } else {
      const { error } = await supabase.from("styles").insert(payload);
      if (error) {
        toast({ title: "Failed to create style", variant: "destructive" });
      } else {
        toast({ title: "Style published! It now appears in Explore Styles." });
      }
    }

    setSubmitting(false);
    setDialogOpen(false);
    resetForm();
    fetchStyles();
  };

  const deleteStyle = async (id: string) => {
    await supabase.from("styles").delete().eq("id", id);
    toast({ title: "Style deleted" });
    fetchStyles();
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Style Gallery</h3>
          <p className="text-sm text-muted-foreground">Upload styles to inspire clients and get bookings.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Style</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStyle ? "Edit Style" : "Upload New Style"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photo *</Label>
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-2 right-2 gap-1"
                      onClick={() => document.getElementById("style-photo-input")?.click()}
                    >
                      <Edit2 className="w-3 h-3" /> Change
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => document.getElementById("style-photo-input")?.click()}
                    className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
                  >
                    <Image className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                  </button>
                )}
                <input id="style-photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              <div className="space-y-2">
                <Label>Style Name *</Label>
                <Input value={styleName} onChange={e => setStyleName(e.target.value)} placeholder="e.g. Box Braids with Beads" />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this style..." rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Style By</Label>
                <Input value={servicesRequired} onChange={e => setServicesRequired(e.target.value)} placeholder="e.g. Salon name or stylist name" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Estimated Time (min)</Label>
                  <Input type="number" value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} placeholder="120" />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Price</Label>
                  <Input type="number" value={estimatedPrice} onChange={e => setEstimatedPrice(e.target.value)} placeholder="85" />
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={submitting || !styleName.trim()} className="w-full">
                {submitting ? "Uploading..." : editingStyle ? "Save Changes" : "Publish Style"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {styles.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl">✨</div>
          <h4 className="font-semibold">No styles yet</h4>
          <p className="text-sm text-muted-foreground">Upload your first style to attract new clients through Explore Styles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {styles.map(style => (
            <Card key={style.id} className="overflow-hidden group">
              <div className="relative aspect-square">
                <img src={style.photo_url} alt={style.style_name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(style)}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteStyle(style.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Badge className="absolute top-2 left-2 bg-background/90 text-foreground text-[9px] uppercase border-0">
                  {style.category}
                </Badge>
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{style.style_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  {style.estimated_price != null && <span>${style.estimated_price}</span>}
                  {style.estimated_time != null && <span>· {style.estimated_time} min</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
