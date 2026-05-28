import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, User, Briefcase, HeartHandshake, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { formatPhoneForTwilio, formatPhoneInput } from "@/utils/phoneFormat";
import authLogo from "@/assets/bellonecta-logo-white.png";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().optional(),
  firstName: z.string().trim().min(1, { message: "First name is required" }).optional(),
  lastName: z.string().trim().min(1, { message: "Last name is required" }).optional(),
  displayName: z.string().trim().optional(),
  telephone: z.string().trim().optional(),
  brandName: z.string().trim().optional(),
  businessName: z.string().trim().optional(),
  organizationName: z.string().trim().optional(),
  registrationNumber: z.string().trim().optional(),
  website: z.string().trim().optional(),
  streetAddress: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zipCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
}).refine((data) => {
  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type AccountType = "individual" | "brand" | "business" | "charitable_partner";
type BusinessOffering = "" | "product" | "services" | "both";

const businessCategories = [
  "Barber", "Beauty Blogger", "Beauty subscription boxes", "Body", "Brows",
  "Dental", "Digital Services", "Education", "Facial", "Fragrance",
  "Hair Removal", "Lashes", "Massages", "Nail technician", "Salons",
  "Skin Care", "Spa", "Sustainability", "Tattoo", "Weight Loss", "Other",
];

const accountTypes = [
  {
    value: "individual" as AccountType,
    icon: User,
    title: "Individual",
    description: "Book appointments and discover beauty services",
  },
  {
    value: "business" as AccountType,
    icon: Briefcase,
    title: "Business",
    description: "Showcase products, manage services, or both",
  },
  {
    value: "charitable_partner" as AccountType,
    icon: HeartHandshake,
    title: "Charitable Partner",
    description: "Partner with us to support charitable causes",
  },
];

// Helper: progress dots
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 pt-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn("w-2 h-2 rounded-full", i + 1 === current ? "bg-primary" : "bg-border")}
        />
      ))}
    </div>
  );
}

export default function Auth() {
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(
    location.state?.mode === "signin" ? false : true
  );
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  // signupStep: 1 = account type, 2+ = form sub-steps
  const [signupStep, setSignupStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [brandName, setBrandName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessOffering, setBusinessOffering] = useState<BusinessOffering>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !loading) navigate("/directory");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (location.state?.mode) {
      setIsSignUp(location.state.mode === "signup" || location.state.mode !== "signin");
      setSignupStep(1);
    }
  }, [location.state]);

  // Total steps per account type (step 1 = account type for all)
  const getTotalSteps = () => {
    if (accountType === "individual") return 4; // 1: type, 2: contact+security, 3: email verify, 4: personal info
    return 5; // 1: type, 2: contact+security, 3: email verify, 4: business info, 5: address
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = authSchema.parse({
        email,
        password,
        confirmPassword: isSignUp ? confirmPassword : undefined,
        firstName: isSignUp && accountType === "individual" ? firstName : undefined,
        lastName: isSignUp && accountType === "individual" ? lastName : undefined,
        displayName: isSignUp && accountType === "individual" ? displayName : undefined,
        telephone: isSignUp ? telephone : undefined,
        brandName: isSignUp && accountType === "brand" ? brandName : undefined,
        businessName: isSignUp && accountType === "business" ? businessName : undefined,
        organizationName: isSignUp && accountType === "charitable_partner" ? organizationName : undefined,
        registrationNumber: isSignUp && accountType === "charitable_partner" ? registrationNumber : undefined,
        website: isSignUp && accountType !== "individual" ? website : undefined,
        streetAddress: isSignUp && accountType !== "individual" ? streetAddress : undefined,
        city: isSignUp && accountType !== "individual" ? city : undefined,
        state: isSignUp && accountType !== "individual" ? state : undefined,
        zipCode: isSignUp && accountType !== "individual" ? zipCode : undefined,
        country: isSignUp && accountType !== "individual" ? country : undefined,
      });

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: accountType === "individual" ? firstName : undefined,
              last_name: accountType === "individual" ? lastName : undefined,
              display_name: displayName,
              telephone: formatPhoneForTwilio(telephone),
              account_type: accountType,
              brand_name: accountType === "brand" ? brandName : undefined,
              business_name: accountType === "business" ? businessName : undefined,
              business_category: accountType === "business" ? businessCategory : undefined,
              organization_name: accountType === "charitable_partner" ? organizationName : undefined,
              registration_number: accountType === "charitable_partner" ? registrationNumber : undefined,
              website: accountType !== "individual" ? website : undefined,
              street_address: accountType !== "individual" ? streetAddress : undefined,
              city: accountType !== "individual" ? city : undefined,
              state: accountType !== "individual" ? state : undefined,
              zip_code: accountType !== "individual" ? zipCode : undefined,
              country: accountType !== "individual" ? country : undefined,
            }
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({ title: "Account exists", description: "This email is already registered. Please sign in instead.", variant: "destructive" });
          } else {
            toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
          }
        } else if (data.user) {
          toast({ title: "Success!", description: "Your account has been created." });
          if (accountType !== "individual") {
            const from = location.state?.from || "/directory";
            navigate("/profile-completion", { state: { from } });
          } else {
            setIsSignUp(false);
            setSignupStep(1);
            setPassword("");
            setConfirmPassword("");
            setFirstName("");
            setLastName("");
            setDisplayName("");
            setTelephone("");
          }
          setBrandName(""); setBusinessName(""); setBusinessCategory("");
          setOrganizationName(""); setRegistrationNumber(""); setWebsite("");
          setStreetAddress(""); setCity(""); setState(""); setZipCode(""); setCountry("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message === "Invalid login credentials" ? "Invalid email or password" : error.message,
            variant: "destructive",
          });
        } else {
          toast({ title: "Welcome back!", description: "You have successfully signed in." });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation error", description: error.errors[0].message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (signupStep === 1) {
      if (accountType === "business" && businessOffering) {
        if (businessOffering === "product") setAccountType("brand");
      }
    }
    setSignupStep((s) => s + 1);
  };

  const handleBack = () => {
    if (signupStep === 2) {
      if (accountType === "brand" && businessOffering === "product") {
        setAccountType("business");
      }
    }
    setSignupStep((s) => s - 1);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const emailSchema = z.string().trim().email({ message: "Invalid email address" });
      const validatedEmail = emailSchema.parse(email);
      const { error } = await supabase.auth.resetPasswordForEmail(validatedEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        const resetLink = `${window.location.origin}/auth?type=recovery`;
        try {
          await supabase.functions.invoke('send-password-reset', {
            body: { email: validatedEmail, resetLink }
          });
        } catch (emailError) {
          console.error('Error sending branded email:', emailError);
        }
        toast({ title: "Check your email", description: "We've sent you a password reset link. Please check your inbox." });
        setIsForgotPassword(false);
        setEmail("");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation error", description: error.errors[0].message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const signInLink = (
    <div className="text-center text-sm">
      <span className="text-muted-foreground">Already have an account? </span>
      <button type="button" onClick={() => { setIsSignUp(false); setSignupStep(1); }} className="text-foreground hover:underline font-medium">
        Sign in here
      </button>
    </div>
  );

  // --- Password fields (reusable) ---
  const passwordFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">Password <span className="text-destructive">*</span></label>
        <PasswordInput
          id="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11"
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password <span className="text-destructive">*</span></label>
        <PasswordInput
          id="confirmPassword"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-11"
          required
          disabled={loading}
        />
      </div>
      <p className="text-xs text-muted-foreground sm:col-span-2">Must be at least 6 characters</p>
    </div>
  );

  // --- Contact fields (reusable) ---
  const contactFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email Address <span className="text-destructive">*</span></label>
        <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required disabled={loading} />
      </div>
      <div className="space-y-2">
        <label htmlFor="telephone" className="text-sm font-medium">Telephone Number</label>
        <Input id="telephone" type="tel" placeholder="+1 (302) 538-9413" value={telephone} onChange={(e) => setTelephone(formatPhoneInput(e.target.value))} className="h-11" disabled={loading} />
        <p className="text-xs text-muted-foreground">Format: +1 (XXX) XXX-XXXX</p>
      </div>
    </div>
  );

  // --- Address fields (reusable) ---
  const addressFields = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="website" className="text-sm font-medium">Website</label>
        <Input id="website" type="url" placeholder="https://your-website.com" value={website} onChange={(e) => setWebsite(e.target.value)} className="h-11" disabled={loading} />
      </div>
      <div className="space-y-2">
        <label htmlFor="streetAddress" className="text-sm font-medium">Street Address <span className="text-destructive">*</span></label>
        <Input id="streetAddress" type="text" placeholder="123 East Street, London, EW21 X12" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className="h-11" required disabled={loading} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium">City/Town <span className="text-destructive">*</span></label>
          <Input id="city" type="text" placeholder="London" value={city} onChange={(e) => setCity(e.target.value)} className="h-11" required disabled={loading} />
        </div>
        <div className="space-y-2">
          <label htmlFor="state" className="text-sm font-medium">State/Province <span className="text-destructive">*</span></label>
          <Input id="state" type="text" placeholder="Greater London" value={state} onChange={(e) => setState(e.target.value)} className="h-11" required disabled={loading} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="zipCode" className="text-sm font-medium">ZIP Code/Postal Code <span className="text-destructive">*</span></label>
          <Input id="zipCode" type="text" placeholder="EW21 X12" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="h-11" required disabled={loading} />
        </div>
        <div className="space-y-2">
          <label htmlFor="country" className="text-sm font-medium">Country/Region <span className="text-destructive">*</span></label>
          <Input id="country" type="text" placeholder="United Kingdom" value={country} onChange={(e) => setCountry(e.target.value)} className="h-11" required disabled={loading} />
        </div>
      </div>
    </div>
  );

  // --- Navigation buttons ---
  const navButtons = (isLastStep: boolean) => (
    <div className="flex gap-3 pt-2">
      <Button type="button" variant="outline" onClick={handleBack} className="h-12 px-8 font-medium" disabled={loading}>
        Back
      </Button>
      {isLastStep ? (
        <Button type="submit" className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 font-medium" disabled={loading}>
          {loading ? "Please wait..." : "Create Account"}
        </Button>
      ) : (
        <Button type="button" onClick={handleNextStep} className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 font-medium">
          Next
        </Button>
      )}
    </div>
  );

  // --- Step header ---
  const stepHeader = (title: string) => (
    <div className="text-center space-y-3">
      <h2 className="text-2xl font-bold">{title}</h2>
      <ProgressDots current={signupStep} total={getTotalSteps()} />
    </div>
  );

  // --- Email verification step (reusable) ---
  const emailVerificationStep = (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
      {stepHeader("Email Verification")}
      <div className="space-y-5">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Mail className="w-8 h-8 text-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              We'll send a verification link to <span className="font-medium text-foreground">{email || "your email"}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              You can verify your email now or after completing registration. Check your inbox for the verification link.
            </p>
          </div>
          <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-foreground" />
            <span>Verification email will be sent upon account creation</span>
          </div>
        </div>
        {navButtons(false)}
      </div>
      {signInLink}
    </div>
  );

  // --- Render Individual sign-up steps ---
  const renderIndividualSteps = () => {
    if (signupStep === 2) {
      return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
          {stepHeader("Contact & Security")}
          <div className="space-y-5">
            {contactFields}
            {passwordFields}
            {navButtons(false)}
          </div>
          {signInLink}
        </div>
      );
    }
    if (signupStep === 3) {
      return emailVerificationStep;
    }
    if (signupStep === 4) {
      return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
          {stepHeader("Personal Information")}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">First Name <span className="text-destructive">*</span></label>
                <Input id="firstName" type="text" placeholder="Enter first name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-11" required disabled={loading} />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">Last Name <span className="text-destructive">*</span></label>
                <Input id="lastName" type="text" placeholder="Enter last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11" required disabled={loading} />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">Screen Name (Optional)</label>
              <Input id="displayName" type="text" placeholder="Choose a display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-11" disabled={loading} />
              <p className="text-xs text-muted-foreground">This will be your public display name on the platform</p>
            </div>
            {navButtons(true)}
          </form>
          {signInLink}
        </div>
      );
    }
    return null;
  };

  // --- Render Brand sign-up steps ---
  const renderBrandSteps = () => {
    if (signupStep === 2) {
      return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
          {stepHeader("Contact & Security")}
          <div className="space-y-5">
            {contactFields}
            {passwordFields}
            {navButtons(false)}
          </div>
          {signInLink}
        </div>
      );
    }
    if (signupStep === 3) {
      return emailVerificationStep;
    }
    if (signupStep === 4) {
      return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
          {stepHeader("Business Information")}
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="brandName" className="text-sm font-medium">Business Name <span className="text-destructive">*</span></label>
              <Input id="brandName" type="text" placeholder="Enter business name" value={brandName} onChange={(e) => setBrandName(e.target.value)} className="h-11" required disabled={loading} />
            </div>
            {navButtons(false)}
          </div>
          {signInLink}
        </div>
      );
    }
    if (signupStep === 5) {
      return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
          {stepHeader("Address Details")}
          <form onSubmit={handleSubmit} className="space-y-5">
            {addressFields}
            {navButtons(true)}
          </form>
          {signInLink}
        </div>
      );
    }
    return null;
  };

  // --- Render Business sign-up steps ---
  const renderBusinessSteps = () => {
    if (signupStep === 2) {
      return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
          {stepHeader("Contact & Security")}
          <div className="space-y-5">
            {contactFields}
            {passwordFields}
            {navButtons(false)}
          </div>
          {signInLink}
        </div>
      );
    }
    if (signupStep === 3) {
      return emailVerificationStep;
    }
    if (signupStep === 4) {
      return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
          {stepHeader("Business Information")}
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="businessName" className="text-sm font-medium">Name of Business <span className="text-destructive">*</span></label>
              <Input id="businessName" type="text" placeholder="Enter business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="h-11" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <label htmlFor="businessCategory" className="text-sm font-medium">Business Category <span className="text-destructive">*</span></label>
              <Select value={businessCategory} onValueChange={setBusinessCategory} disabled={loading} required>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent className="bg-background z-[100] max-h-[300px]" position="popper">
                  {businessCategories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {navButtons(false)}
          </div>
          {signInLink}
        </div>
      );
    }
    if (signupStep === 5) {
      return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
          {stepHeader("Address Details")}
          <form onSubmit={handleSubmit} className="space-y-5">
            {addressFields}
            {navButtons(true)}
          </form>
          {signInLink}
        </div>
      );
    }
    return null;
  };

  // --- Render Charity sign-up steps ---
  const renderCharitySteps = () => {
    if (signupStep === 2) {
      return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
          {stepHeader("Contact & Security")}
          <div className="space-y-5">
            {contactFields}
            {passwordFields}
            {navButtons(false)}
          </div>
          {signInLink}
        </div>
      );
    }
    if (signupStep === 3) {
      return emailVerificationStep;
    }
    if (signupStep === 4) {
      return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
          {stepHeader("Organization Information")}
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="organizationName" className="text-sm font-medium">Organization Name <span className="text-destructive">*</span></label>
              <Input id="organizationName" type="text" placeholder="Enter organization name" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className="h-11" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <label htmlFor="registrationNumber" className="text-sm font-medium">Registration Number <span className="text-destructive">*</span></label>
              <Input id="registrationNumber" type="text" placeholder="Enter charity registration number" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className="h-11" required disabled={loading} />
            </div>
            {navButtons(false)}
          </div>
          {signInLink}
        </div>
      );
    }
    if (signupStep === 5) {
      return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
          {stepHeader("Address Details")}
          <form onSubmit={handleSubmit} className="space-y-5">
            {addressFields}
            {navButtons(true)}
          </form>
          {signInLink}
        </div>
      );
    }
    return null;
  };

  // --- Render sign-up form steps based on account type ---
  const renderSignupFormSteps = () => {
    switch (accountType) {
      case "individual": return renderIndividualSteps();
      case "brand": return renderBrandSteps();
      case "business": return renderBusinessSteps();
      case "charitable_partner": return renderCharitySteps();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <Button variant="ghost" onClick={() => navigate("/directory")} className="absolute top-4 left-4 z-10">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Directory
      </Button>
      <div className="w-full max-w-md">
        {isSignUp && signupStep === 1 ? (
          // Step 1: Account Type Selection
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">Create your account to get started</p>
              <h2 className="text-2xl font-bold">Choose Account Type</h2>
              <ProgressDots current={1} total={getTotalSteps()} />
            </div>

            <div className="space-y-3">
              {accountTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = accountType === type.value;
                return (
                  <div key={type.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountType(type.value);
                        if (type.value !== "business") setBusinessOffering("");
                      }}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-all",
                        isSelected ? "border-foreground bg-muted" : "border-border bg-background hover:border-muted-foreground"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={cn("w-5 h-5 mt-0.5", isSelected ? "text-foreground" : "text-muted-foreground")} />
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{type.title}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{type.description}</p>
                        </div>
                      </div>
                    </button>
                    {type.value === "business" && isSelected && (
                      <div className="mt-3 ml-8 space-y-2">
                        <label className="text-sm font-medium">What do you offer?</label>
                        <Select value={businessOffering} onValueChange={(val) => setBusinessOffering(val as BusinessOffering)}>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Select an option" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="services">Services</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              onClick={handleNextStep}
              disabled={accountType === "business" && !businessOffering}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-medium text-base rounded-md"
            >
              Next
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <button type="button" onClick={() => setIsSignUp(false)} className="text-foreground hover:underline font-medium">
                Sign in here
              </button>
            </div>
          </div>
        ) : isSignUp && signupStep >= 2 ? (
          renderSignupFormSteps()
        ) : isForgotPassword ? (
          // Forgot Password
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold">Reset your password</h2>
              <p className="text-muted-foreground">Enter your email address and we'll send you a link to reset your password</p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email address</label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required disabled={loading} />
              </div>
              <Button type="submit" className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-medium text-base rounded-md" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Remember your password? </span>
              <button type="button" onClick={() => { setIsForgotPassword(false); setEmail(""); }} className="text-foreground hover:underline font-medium">
                Sign in here
              </button>
            </div>
          </div>
        ) : (
          // Sign In
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <img src={authLogo} alt="BelloNecta" className="h-24 w-auto" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Welcome back</h2>
                <p className="text-muted-foreground">Sign in to your account to continue</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email address</label>
                  <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">Password</label>
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-foreground hover:underline">Forgot password?</button>
                  </div>
                  <PasswordInput
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-medium text-base rounded-md" disabled={loading}>
                {loading ? "Please wait..." : "Sign In"}
              </Button>
            </form>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <button type="button" onClick={() => { setIsSignUp(true); setSignupStep(1); setPassword(""); }} className="text-foreground hover:underline font-medium">
                Sign up here
              </button>
            </div>
          </div>
        )}

        {isSignUp && signupStep === 1 && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-foreground hover:underline">Terms of Service</a>{" "}and{" "}
            <a href="#" className="text-foreground hover:underline">Privacy Policy</a>
          </p>
        )}
      </div>
    </div>
  );
}
