import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Image as ImageIcon, Plus, Trash2, Edit2, Image } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  display_order: number;
  photo_type: string;
}

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

export const BusinessPhotos = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploadingDirectory, setUploadingDirectory] = useState(false);
  const [directoryPhotos, setDirectoryPhotos] = useState<Photo[]>([]);
  const { toast } = useToast();

  // Unified styles state (merged Portfolio + Styles)
  const [styles, setStyles] = useState<StyleItem[]>([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState<Photo[]>([]);
  const [stylesLoading, setStylesLoading] = useState(true);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<StyleItem | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("hair");
  const [formDescription, setFormDescription] = useState("");
  const [formEstimatedTime, setFormEstimatedTime] = useState("");
  const [formEstimatedPrice, setFormEstimatedPrice] = useState("");
  const [formPhotoFile, setFormPhotoFile] = useState<File | null>(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Display location checkboxes
  const [displayOnProfile, setDisplayOnProfile] = useState(true);
  const [displayOnExplore, setDisplayOnExplore] = useState(true);

  useEffect(() => {
    loadPhotos();
    fetchStyles();
  }, []);

  const loadPhotos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("business_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true });

      if (error) throw error;

      const dirPhotos = (data || []).filter(p => p.photo_type === 'directory');
      const profPhotos = (data || []).filter(p => p.photo_type === 'profile');

      setDirectoryPhotos(dirPhotos);
      setPortfolioPhotos(profPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStyles = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) { setStylesLoading(false); return; }
    const { data } = await supabase
      .from("styles")
      .select("*")
      .eq("professional_id", currentUser.id)
      .order("created_at", { ascending: false });
    setStyles(data || []);
    setStylesLoading(false);
  };

  const handleDirectoryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingDirectory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("business_photos")
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          display_order: directoryPhotos.length,
          photo_type: 'directory',
        });

      if (insertError) throw insertError;

      await loadPhotos();
      toast({ title: "Photo uploaded", description: "Your directory photo has been added." });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({ title: "Error", description: "Failed to upload photo.", variant: "destructive" });
    } finally {
      setUploadingDirectory(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    try {
      const { error } = await supabase.from("business_photos").delete().eq("id", id);
      if (error) throw error;
      await loadPhotos();
      toast({ title: "Photo deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete photo.", variant: "destructive" });
    }
  };

  // === Unified style form ===
  const resetForm = () => {
    setFormName("");
    setFormCategory("hair");
    setFormDescription("");
    setFormEstimatedTime("");
    setFormEstimatedPrice("");
    setFormPhotoFile(null);
    setFormPhotoPreview("");
    setEditingStyle(null);
    setDisplayOnProfile(true);
    setDisplayOnExplore(true);
  };

  const openEditStyle = (style: StyleItem) => {
    setEditingStyle(style);
    setFormName(style.style_name);
    setFormCategory(style.category);
    setFormDescription(style.description || "");
    setFormEstimatedTime(style.estimated_time?.toString() || "");
    setFormEstimatedPrice(style.estimated_price?.toString() || "");
    setFormPhotoPreview(style.photo_url);
    setDisplayOnProfile(true);
    setDisplayOnExplore(true);
    setStyleDialogOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormPhotoFile(file);
      setFormPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleStyleSubmit = async () => {
    if (!user || !formName.trim()) return;
    if (!editingStyle && !formPhotoFile) {
      toast({ title: "Please upload a photo", variant: "destructive" });
      return;
    }
    if (!displayOnProfile && !displayOnExplore) {
      toast({ title: "Please select at least one display location", variant: "destructive" });
      return;
    }

    setFormSubmitting(true);
    let photoUrl = editingStyle?.photo_url || "";

    if (formPhotoFile) {
      const ext = formPhotoFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("style-photos")
        .upload(path, formPhotoFile);
      if (uploadError) {
        toast({ title: "Failed to upload photo", variant: "destructive" });
        setFormSubmitting(false);
        return;
      }
      const { data: publicUrl } = supabase.storage.from("style-photos").getPublicUrl(path);
      photoUrl = publicUrl.publicUrl;
    }

    const { data: biz } = await supabase
      .from("business_profiles")
      .select("address, business_name")
      .eq("user_id", user.id)
      .single();

    // Save to Explore Styles (styles table)
    if (displayOnExplore) {
      const payload = {
        style_name: formName.trim(),
        category: formCategory,
        photo_url: photoUrl,
        description: formDescription.trim() || null,
        services_required: biz?.business_name ? [biz.business_name] : [],
        estimated_time: formEstimatedTime ? parseInt(formEstimatedTime) : null,
        estimated_price: formEstimatedPrice ? parseFloat(formEstimatedPrice) : null,
        location: biz?.address || null,
        professional_id: user.id,
      };

      if (editingStyle) {
        const { error } = await supabase.from("styles").update(payload).eq("id", editingStyle.id);
        if (error) toast({ title: "Failed to update style", variant: "destructive" });
      } else {
        const { error } = await supabase.from("styles").insert(payload);
        if (error) toast({ title: "Failed to create style", variant: "destructive" });
      }
    }

    // Save to Profile Portfolio (business_photos table)
    if (displayOnProfile && !editingStyle) {
      await supabase.from("business_photos").insert({
        user_id: user.id,
        photo_url: photoUrl,
        caption: formName.trim(),
        display_order: portfolioPhotos.length,
        photo_type: 'profile',
      });
    }

    toast({
      title: editingStyle ? "Style updated" : "Style published!",
      description: editingStyle
        ? "Your changes have been saved."
        : `Displayed on: ${[displayOnProfile && "Profile", displayOnExplore && "Explore Styles"].filter(Boolean).join(" & ")}`,
    });

    setFormSubmitting(false);
    setStyleDialogOpen(false);
    resetForm();
    fetchStyles();
    loadPhotos();
  };

  const deleteStyle = async (id: string) => {
    await supabase.from("styles").delete().eq("id", id);
    toast({ title: "Style deleted" });
    fetchStyles();
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
        <h3 className="text-lg font-semibold mb-2">Photos & Styles</h3>
        <p className="text-sm text-muted-foreground">
          Manage your photos and style gallery.
        </p>
      </div>

      <Tabs defaultValue="directory" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="directory">Directory Photo</TabsTrigger>
          <TabsTrigger value="styles">Styles</TabsTrigger>
        </TabsList>

        {/* Directory Photo Tab */}
        <TabsContent value="directory" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
              <ImageIcon className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium mb-1">Directory Card Photo</h4>
                <p className="text-sm text-muted-foreground">
                  This photo will appear on your business card in the Directory page. Upload a high-quality image that best represents your business.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="directory-upload" className="cursor-pointer">
                <div className="flex items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg hover:border-primary hover:bg-muted/50 transition-all">
                  <Upload className="h-6 w-6" />
                  <div className="text-center">
                    <span className="font-medium">Upload Directory Photo</span>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </Label>
              <Input
                id="directory-upload"
                type="file"
                accept="image/*"
                onChange={handleDirectoryUpload}
                disabled={uploadingDirectory}
                className="hidden"
              />
            </div>

            {uploadingDirectory && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading directory photo...
              </div>
            )}

            {directoryPhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {directoryPhotos.map(photo => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || "Directory photo"}
                      className="w-full aspect-square object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => handleDeletePhoto(photo.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 border-2 border-dashed rounded-lg">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium mb-1">No directory photo uploaded</p>
                <p className="text-sm text-muted-foreground">Upload a photo to showcase your business in the directory</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Unified Styles Tab */}
        <TabsContent value="styles" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Style Gallery</h4>
              <p className="text-sm text-muted-foreground">Upload styles and choose where they appear.</p>
            </div>
            <Dialog open={styleDialogOpen} onOpenChange={(open) => { setStyleDialogOpen(open); if (!open) resetForm(); }}>
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
                    {formPhotoPreview ? (
                      <div className="relative">
                        <img src={formPhotoPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
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
                    <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Box Braids with Beads" />
                  </div>

                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={formCategory} onValueChange={setFormCategory}>
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
                    <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Describe this style..." rows={3} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Estimated Time (min)</Label>
                      <Input type="number" value={formEstimatedTime} onChange={e => setFormEstimatedTime(e.target.value)} placeholder="120" />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Price</Label>
                      <Input type="number" value={formEstimatedPrice} onChange={e => setFormEstimatedPrice(e.target.value)} placeholder="85" />
                    </div>
                  </div>

                  {/* Display Location */}
                  {!editingStyle && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                      <Label className="text-sm font-medium">Display on</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="display-profile"
                            checked={displayOnProfile}
                            onCheckedChange={(checked) => setDisplayOnProfile(checked === true)}
                          />
                          <label htmlFor="display-profile" className="text-sm cursor-pointer">
                            Public Profile (Portfolio)
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="display-explore"
                            checked={displayOnExplore}
                            onCheckedChange={(checked) => setDisplayOnExplore(checked === true)}
                          />
                          <label htmlFor="display-explore" className="text-sm cursor-pointer">
                            Explore Styles (discoverable by all users)
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleStyleSubmit} disabled={formSubmitting || !formName.trim()} className="w-full">
                    {formSubmitting ? "Uploading..." : editingStyle ? "Save Changes" : "Publish Style"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {stylesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : styles.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-4xl">✨</div>
              <h4 className="font-semibold">No styles yet</h4>
              <p className="text-sm text-muted-foreground">Upload your first style to attract new clients.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {styles.map(style => (
                <Card key={style.id} className="overflow-hidden group">
                  <div className="relative aspect-square">
                    <img src={style.photo_url} alt={style.style_name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditStyle(style)}>
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
                  <CardContent className="p-2.5">
                    <p className="text-xs font-medium truncate">{style.style_name}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                      {style.estimated_price != null && <span>${style.estimated_price}</span>}
                      {style.estimated_time != null && <span>· {style.estimated_time} min</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
