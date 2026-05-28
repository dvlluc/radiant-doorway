import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const INTERESTS = [
  "Hair",
  "Nails",
  "Makeup",
  "Dental",
  "Facials",
  "Body",
  "Education",
  "Sustainability",
  "Events",
  "Jobs",
  "Beauty Pets",
];

export default function ProfileCompletion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<string>("");
  
  // Form state
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [wantsPremium, setWantsPremium] = useState<boolean | null>(null);
  const [wantsBooking, setWantsBooking] = useState<boolean | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    const resolveAccountType = async () => {
      if (!user) return;

      if (user.user_metadata?.account_type) {
        setAccountType(user.user_metadata.account_type);
        return;
      }

      const [roleResult, businessResult, brandResult, charityResult] = await Promise.all([
        supabase.from("user_roles").select("account_type").eq("user_id", user.id).maybeSingle(),
        supabase.from("business_profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("brand_profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("charitable_profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
      ]);

      const resolvedType = roleResult.data?.account_type
        || (businessResult.data ? "business" : null)
        || (brandResult.data ? "brand" : null)
        || (charityResult.data ? "charitable_partner" : null)
        || "individual";

      setAccountType(resolvedType);
    };

    void resolveAccountType();
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else if (prev.length < 5) {
        return [...prev, interest];
      }
      return prev;
    });
  };

  const handleSkip = () => {
    const returnTo = location.state?.from || "/directory";
    navigate(returnTo);
  };

  const handleSave = async () => {
    // Validate minimum interests
    if (selectedInterests.length < 3) {
      toast({
        title: "Select interests",
        description: "Please select at least 3 interests",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a description",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let uploadedLogoUrl = logoUrl;

      // Upload logo if selected
      if (logoFile && user) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        console.log('Upload attempt:', {
          userId: user.id,
          filePath,
          bucketId: 'avatars',
          fileSize: logoFile.size,
          fileType: logoFile.type
        });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, logoFile, {
            upsert: true
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Error uploading image",
            description: uploadError.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        } else {
          console.log('Upload successful:', uploadData);
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          uploadedLogoUrl = publicUrl;
          console.log('Public URL:', publicUrl);
        }
      }

      // Keep main profile avatar in sync for all account types
      if (uploadedLogoUrl && user) {
        await supabase
          .from("profiles")
          .update({ avatar_url: uploadedLogoUrl })
          .eq("id", user.id);
      }

      // Update the appropriate profile table based on account type
      let updateError = null;

      if (accountType === "business") {
        const { error } = await supabase
          .from("business_profiles")
          .update({
            about_us: description,
            interests: selectedInterests,
            logo_url: uploadedLogoUrl,
            avatar_url: uploadedLogoUrl,
            wants_premium: wantsPremium,
            wants_booking: wantsBooking,
            profile_completed: true,
          })
          .eq("user_id", user?.id);
        updateError = error;
      } else if (accountType === "brand") {
        const { error } = await supabase
          .from("brand_profiles")
          .update({
            about_us: description,
            interests: selectedInterests,
            logo_url: uploadedLogoUrl,
            avatar_url: uploadedLogoUrl,
            wants_premium: wantsPremium,
            wants_booking: wantsBooking,
            profile_completed: true,
          })
          .eq("user_id", user?.id);
        updateError = error;
      } else if (accountType === "charitable_partner") {
        const { error } = await supabase
          .from("charitable_profiles")
          .update({
            about_us: description,
            interests: selectedInterests,
            logo_url: uploadedLogoUrl,
            avatar_url: uploadedLogoUrl,
            wants_premium: wantsPremium,
            wants_booking: wantsBooking,
            profile_completed: true,
          })
          .eq("user_id", user?.id);
        updateError = error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .update({
            bio: description,
            interests: selectedInterests,
            avatar_url: uploadedLogoUrl,
            wants_premium: wantsPremium,
            wants_booking: wantsBooking,
            profile_completed: true,
          })
          .eq("id", user?.id);
        updateError = error;
      }

      if (updateError) {
        toast({
          title: "Error",
          description: "Failed to save profile. Please try again.",
          variant: "destructive",
        });
      } else {
        // Invalidate the user profile cache so avatar updates everywhere
        await queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });

        toast({
          title: "Success!",
          description: "Your profile has been completed.",
        });

        // Redirect to the page they were on before auth, or home
        const returnTo = location.state?.from || "/directory";
        navigate(returnTo);
      }
    } catch (error) {
      console.error("Profile completion error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl bg-card rounded-xl border border-border/80 shadow-card p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Congratulations!</h1>
          <p className="text-muted-foreground">Your account was successfully created. Now, let's complete your profile</p>
        </div>

        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {accountType === "individual" ? "Profile Picture" : "Business Logo"}
            </label>
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="w-32 h-32 border-2 border-dashed border-border">
                  {logoUrl ? (
                    <AvatarImage src={logoUrl} alt="Logo" />
                  ) : (
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {accountType === "individual" ? "Profile" : "Logo"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="logo-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center cursor-pointer hover:bg-foreground/90 transition-colors border-2 border-background"
                >
                  <Camera className="w-4 h-4" />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => { setLogoUrl(""); setLogoFile(null); }}
                    disabled={loading}
                    className="absolute top-0 right-0 w-7 h-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-destructive/90 transition-colors border-2 border-background"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description<span className="text-destructive">*</span>
            </label>
          <Textarea
            id="description"
            placeholder="Enter description"
            value={description}
            onChange={(e) => {
              if (e.target.value.length <= 70) {
                setDescription(e.target.value);
              }
            }}
            className="min-h-[100px] resize-none"
            disabled={loading}
          />
          <div className="text-xs text-right text-muted-foreground">
            {description.length}/70
          </div>
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Select a minimum of three or a maximum of five interests
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <Button
                    key={interest}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => toggleInterest(interest)}
                    disabled={loading || (!isSelected && selectedInterests.length >= 5)}
                    className="rounded-full"
                  >
                    {interest}
                    {isSelected && <Check className="ml-1 w-4 h-4" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Online Booking */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Enable online appointment booking for your business?</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={wantsBooking === true ? "default" : "outline"}
                  onClick={() => setWantsBooking(true)}
                  disabled={loading}
                  className="rounded-full"
                >
                  {wantsBooking === true && <Check className="mr-1 w-4 h-4" />}
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={wantsBooking === false ? "default" : "outline"}
                  onClick={() => setWantsBooking(false)}
                  disabled={loading}
                  className="rounded-full"
                >
                  No
                </Button>
              </div>
            </div>
            {wantsBooking && (
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to a monthly subscription fee of $24.99 to use the Online Booking platform.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 h-12 hover:bg-muted"
          >
            Skip
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90"
          >
            Save and Continue →
          </Button>
        </div>
      </div>
    </div>
  );
}
