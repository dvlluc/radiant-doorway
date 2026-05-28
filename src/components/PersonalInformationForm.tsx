import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, User, Sparkles, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPhoneForTwilio, formatPhoneInput } from "@/utils/phoneFormat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BUSINESS_CATEGORIES = [
  "Salons",
  "Nails",
  "Skin",
  "Makeup",
  "Barbers",
  "Spa",
  "Hair Braiding",
  "Lashes",
  "Brows",
  "Aesthetics",
  "Massage",
  "Waxing",
];

interface PersonalInformationFormProps {
  userId: string;
  profile: any;
  accountType: string;
}

export function PersonalInformationForm({ userId, profile, accountType }: PersonalInformationFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [bioLength, setBioLength] = useState(0);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [bookingLink, setBookingLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const maxBioChars = 40;
  
  const [formData, setFormData] = useState({
    accountNumber: "",
    screenName: "",
    organizationName: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    bio: "",
    website: "",
    businessCategory: "",
    businessHours: "",
    avatarUrl: ""
  });

  useEffect(() => {
    const loadProfileData = async () => {
      if (!profile) return;
      
      const charCount = profile.bio ? profile.bio.length : 0;
      setBioLength(charCount);
      
      // Format registration number as 5-digit padded string
      const registrationNum = profile.registration_number 
        ? String(profile.registration_number).padStart(5, '0')
        : '00000';
      
      // Fetch full organization-specific data based on account type
      let organizationName = "";
      let orgFirstName = profile.first_name || "";
      let orgLastName = profile.last_name || "";
      let orgPhone = profile.telephone || "";
      let orgAddress = "";
      let orgWebsite = "";
      let orgCategory = "";
      
      if (accountType === "charitable_partner") {
        const { data } = await supabase
          .from("charitable_profiles")
          .select("organization_name, first_name, last_name, telephone, address, website")
          .eq("user_id", userId)
          .maybeSingle();
        if (data) {
          organizationName = data.organization_name || "";
          orgFirstName = data.first_name || orgFirstName;
          orgLastName = data.last_name || orgLastName;
          orgPhone = data.telephone || orgPhone;
          orgAddress = data.address || "";
          orgWebsite = data.website || "";
        }
      } else if (accountType === "brand") {
        const { data } = await supabase
          .from("brand_profiles")
          .select("brand_name, first_name, last_name, telephone, address, website")
          .eq("user_id", userId)
          .maybeSingle();
        if (data) {
          organizationName = data.brand_name || "";
          orgFirstName = data.first_name || orgFirstName;
          orgLastName = data.last_name || orgLastName;
          orgPhone = data.telephone || orgPhone;
          orgAddress = data.address || "";
          orgWebsite = data.website || "";
        }
      } else if (accountType === "business") {
        const { data } = await supabase
          .from("business_profiles")
          .select("business_name, first_name, last_name, telephone, address, website, category")
          .eq("user_id", userId)
          .maybeSingle();
        if (data) {
          organizationName = data.business_name || "";
          orgFirstName = data.first_name || orgFirstName;
          orgLastName = data.last_name || orgLastName;
          orgPhone = data.telephone || orgPhone;
          orgAddress = data.address || "";
          orgWebsite = data.website || "";
          orgCategory = data.category || "";
          if (data.business_name) {
            const slug = data.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            setBookingLink(`${window.location.origin}/booking/${slug}`);
          }
        }
      }
      
      // Parse address if it exists
      let parsedCity = "";
      let parsedState = "";
      let parsedZip = "";
      let parsedCountry = "";
      
      if (orgAddress) {
        // Try to parse address into components
        const addressParts = orgAddress.split(',').map(p => p.trim());
        if (addressParts.length >= 2) {
          parsedCity = addressParts[0] || "";
          parsedCountry = addressParts[addressParts.length - 1] || "";
          if (addressParts.length >= 3) {
            parsedState = addressParts[1] || "";
          }
        }
      }
      
      setFormData({
        accountNumber: registrationNum,
        screenName: profile.display_name || "",
        organizationName: organizationName,
        firstName: orgFirstName,
        lastName: orgLastName,
        email: profile.email || "",
        phoneNumber: orgPhone,
        streetAddress: orgAddress,
        city: parsedCity,
        state: parsedState,
        zipCode: parsedZip,
        country: parsedCountry,
        bio: profile.bio || "",
        website: orgWebsite,
        businessCategory: orgCategory,
        businessHours: "",
        avatarUrl: profile.avatar_url || ""
      });
    };
    
    loadProfileData();
  }, [profile, accountType, userId]);

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.slice(0, maxBioChars);
    setFormData({ ...formData, bio: text });
    setBioLength(text.length);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please choose a JPG, PNG or GIF image",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Save to database immediately
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setFormData({ ...formData, avatarUrl: publicUrl });
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been saved successfully."
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          telephone: formatPhoneForTwilio(formData.phoneNumber),
          bio: formData.bio,
          avatar_url: formData.avatarUrl
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Build full address string
      const addressParts = [
        formData.streetAddress,
        formData.city,
        formData.state,
        formData.zipCode,
        formData.country,
      ].filter(Boolean);
      const fullAddress = addressParts.join(", ");

      // Update organization-specific table if applicable
      if (accountType === "charitable_partner" && formData.organizationName) {
        const { error: charityError } = await supabase
          .from("charitable_profiles")
          .update({
            organization_name: formData.organizationName,
            first_name: formData.firstName,
            last_name: formData.lastName,
            telephone: formatPhoneForTwilio(formData.phoneNumber),
            address: fullAddress || formData.streetAddress,
            website: formData.website
          })
          .eq("user_id", userId);
        
        if (charityError) throw charityError;
      } else if (accountType === "brand" && formData.organizationName) {
        const { error: brandError } = await supabase
          .from("brand_profiles")
          .update({
            brand_name: formData.organizationName,
            first_name: formData.firstName,
            last_name: formData.lastName,
            telephone: formatPhoneForTwilio(formData.phoneNumber),
            address: fullAddress || formData.streetAddress,
            website: formData.website
          })
          .eq("user_id", userId);
        
        if (brandError) throw brandError;
      } else if (accountType === "business") {
        const { error: businessError } = await supabase
          .from("business_profiles")
          .update({
            business_name: formData.organizationName,
            category: formData.businessCategory || null,
            first_name: formData.firstName,
            last_name: formData.lastName,
            telephone: formatPhoneForTwilio(formData.phoneNumber),
            address: fullAddress,
            website: formData.website
          })
          .eq("user_id", userId);
        
        if (businessError) throw businessError;
      }

      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved successfully."
      });
      
      // Brief pause to show the success message, then reload
      setTimeout(() => {
        setIsEditMode(false);
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for your avatar",
        variant: "destructive"
      });
      return;
    }

    setGeneratingAvatar(true);
    try {
      // Call edge function to generate avatar
      const { data, error } = await supabase.functions.invoke("generate-avatar", {
        body: { prompt: aiPrompt }
      });

      if (error) throw error;

      if (!data?.imageUrl) {
        throw new Error("No image generated");
      }

      // Convert base64 to blob
      const base64Response = await fetch(data.imageUrl);
      const blob = await base64Response.blob();

      // Upload to Supabase storage
      const fileExt = "png";
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, {
          contentType: "image/png",
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update form data with new avatar URL
      setFormData({ ...formData, avatarUrl: publicUrl });

      toast({
        title: "Avatar Generated!",
        description: "Your AI-generated avatar is ready. Don't forget to save your changes."
      });

      setShowAiDialog(false);
      setAiPrompt("");
    } catch (error: any) {
      console.error("Avatar generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingAvatar(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Update your personal details and contact information.</p>
        {!isEditMode && (
          <Button onClick={() => setIsEditMode(true)} variant="outline">
            Edit
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <h2 className="text-xl font-semibold">
            {accountType === "charitable_partner" ? "Charity Information" :
             accountType === "brand" ? "Brand Information" :
             accountType === "business" ? "Business Information" :
             "Profile Details"}
          </h2>

          {/* Account Number and Screen Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                disabled
                className="bg-muted"
              />
            </div>
            {formData.screenName && (
              <div className="space-y-2">
                <Label htmlFor="screenName">Screen name</Label>
                <Input
                  id="screenName"
                  value={formData.screenName}
                  disabled={!isEditMode}
                  className={!isEditMode ? "bg-muted" : ""}
                />
              </div>
            )}
          </div>

          {/* Booking Link - Business accounts only */}
          {accountType === "business" && bookingLink && (
            <div className="space-y-2">
              <Label>Booking Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={bookingLink}
                  disabled
                  className="bg-muted flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(bookingLink);
                    setCopiedLink(true);
                    toast({ title: "Copied!", description: "Booking link copied to clipboard." });
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                >
                  {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Profile Picture - moved after Account Number */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 cursor-pointer mx-auto sm:mx-0" onClick={handleAvatarClick}>
                <AvatarImage src={formData.avatarUrl} />
                <AvatarFallback className="bg-muted">
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 w-full space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAvatarClick}
                  className="w-full"
                  disabled={!isEditMode}
                >
                  Choose File
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAiDialog(true)}
                  className="w-full"
                  disabled={!isEditMode}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Avatar
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF (Max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Organization Name and Website - only for non-individual accounts */}
          {accountType !== "individual" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">
                  {accountType === "charitable_partner" ? "Charity Name" :
                   accountType === "brand" ? "Business Name" :
                   accountType === "business" ? "Business Name" : "Organization Name"}
                </Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                  disabled={!isEditMode}
                  className={!isEditMode ? "bg-muted" : ""}
                  placeholder={
                    accountType === "charitable_partner" ? "Enter your charity name" :
                    accountType === "brand" ? "Enter your business name" :
                    accountType === "business" ? "Enter your business name" : "Enter organization name"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={!isEditMode}
                  className={!isEditMode ? "bg-muted" : ""}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          )}

          {/* Business Category - business accounts only */}
          {accountType === "business" && (
            <div className="space-y-2">
              <Label htmlFor="businessCategory">Business Category</Label>
              <Select
                value={formData.businessCategory}
                onValueChange={(value) => setFormData({ ...formData, businessCategory: value })}
                disabled={!isEditMode}
              >
                <SelectTrigger id="businessCategory" className={!isEditMode ? "bg-muted" : ""}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* First Name and Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditMode}
                className={!isEditMode ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditMode}
                className={!isEditMode ? "bg-muted" : ""}
              />
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Telephone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (302) 538-9413"
                value={formData.phoneNumber}
                onChange={(e) => {
                  const formatted = formatPhoneInput(e.target.value);
                  setFormData({ ...formData, phoneNumber: formatted });
                }}
                disabled={!isEditMode}
                className={!isEditMode ? "bg-muted" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Format: +1 (XXX) XXX-XXXX
              </p>
            </div>
          </div>

          {/* Address fields - only for business/brand accounts */}
          {accountType !== "individual" && (
            <>
              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  disabled={!isEditMode}
                  className={!isEditMode ? "bg-muted" : ""}
                  placeholder="123 Main Street, Apt 4B"
                />
              </div>

              {/* City and State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City/Town</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={!isEditMode}
                    className={!isEditMode ? "bg-muted" : ""}
                    placeholder="London"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    disabled={!isEditMode}
                    className={!isEditMode ? "bg-muted" : ""}
                    placeholder="Greater London"
                  />
                </div>
              </div>

              {/* ZIP Code and Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code/Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    disabled={!isEditMode}
                    className={!isEditMode ? "bg-muted" : ""}
                    placeholder="EW21 X12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country/Region</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    disabled={!isEditMode}
                    className={!isEditMode ? "bg-muted" : ""}
                    placeholder="United Kingdom"
                  />
                </div>
              </div>
            </>
          )}

          {/* Bio - now full width, only for individual accounts */}
          {accountType === "individual" && (
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Max {maxBioChars} characters)</Label>
              <Textarea
                id="bio"
                rows={3}
                value={formData.bio}
                onChange={handleBioChange}
                disabled={!isEditMode}
                className={`resize-none ${!isEditMode ? "bg-muted" : ""}`}
                placeholder="Brief bio about yourself"
              />
              <p className="text-xs text-muted-foreground">
                {bioLength} / {maxBioChars} characters
              </p>
            </div>
          )}

          {/* AI Avatar Generation Dialog */}
          <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate AI Avatar</DialogTitle>
                <DialogDescription>
                  Describe the avatar you'd like to generate. Be specific about style, colors, and details.
                  <span className="block mt-2 text-xs text-green-600 font-medium">
                    ✨ Free during promotional period (until Oct 6, 2025)
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aiPrompt">Avatar Description</Label>
                  <Textarea
                    id="aiPrompt"
                    placeholder="Example: Professional headshot with glasses and a friendly smile, business casual attire, neutral background"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAiDialog(false);
                    setAiPrompt("");
                  }}
                  disabled={generatingAvatar}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateAvatar}
                  disabled={generatingAvatar || !aiPrompt.trim()}
                >
                  {generatingAvatar ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Save Button */}
          {isEditMode && (
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-black text-white hover:bg-black/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}