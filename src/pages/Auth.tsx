import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Briefcase, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { formatPhoneForTwilio, formatPhoneInput } from "@/utils/phoneFormat";
import authLogo from "@/assets/bellonecta-logo-white.png";

const authBaseSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().optional(),
  firstName: z.string().trim().min(1, { message: "First name is required" }).optional(),
  lastName: z.string().trim().min(1, { message: "Last name is required" }).optional(),
  displayName: z.string().trim().optional(),
  telephone: z.string().trim().min(1, { message: "Telephone number is required" }).optional(),
});

const authSchema = authBaseSchema.refine((data) => {
  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const signupIndividualSchema = authBaseSchema.extend({
  telephone: z.string().trim().min(1, { message: "Telephone number is required" }),
  firstName: z.string().trim().min(1, { message: "First name is required" }),
  lastName: z.string().trim().min(1, { message: "Last name is required" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const signupBusinessSchema = authBaseSchema.extend({
  telephone: z.string().trim().min(1, { message: "Telephone number is required" }),
  businessName: z.string().trim().min(1, { message: "Business name is required" }),
  businessCategory: z.string().trim().min(1, { message: "Business category is required" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

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

type AccountType = "individual" | "business";

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
    description: "Showcase your services or portfolio",
  },
];

// Helper: progress dots
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 pt-1">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn("w-2 h-2 rounded-full", i + 1 === current ? "bg-accent" : "bg-border")}
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
  // signupStep: 1 = account type, 2 = full form, 3 = email verification + submit
  const [signupStep, setSignupStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
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

  const getTotalSteps = () => 3;

  const getSignupFormData = () => ({
    email,
    password,
    confirmPassword,
    telephone,
    firstName: accountType === "individual" ? firstName : undefined,
    lastName: accountType === "individual" ? lastName : undefined,
    displayName: accountType === "individual" ? displayName : undefined,
    businessName: accountType === "business" ? businessName : undefined,
    businessCategory: accountType === "business" ? businessCategory : undefined,
  });

  const validateSignupForm = () => {
    const formData = getSignupFormData();
    if (accountType === "individual") {
      return signupIndividualSchema.parse(formData);
    }
    return signupBusinessSchema.parse(formData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const validatedData = validateSignupForm();

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
              business_name: accountType === "business" ? businessName : undefined,
              business_category: accountType === "business" ? businessCategory : undefined,
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
        }
      } else {
        const validatedData = authSchema.parse({
          email,
          password,
        });

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
    if (isSignUp && signupStep === 2) {
      try {
        validateSignupForm();
        setSignupStep(3);
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({ title: "Validation error", description: error.errors[0].message, variant: "destructive" });
        }
      }
      return;
    }
    setSignupStep((s) => s + 1);
  };

  const handleBack = () => {
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
      <button type="button" onClick={() => { setIsSignUp(false); setSignupStep(1); }} className="text-accent hover:underline font-medium">
        Sign in here
      </button>
    </div>
  );

  // --- Password fields (reusable) ---
  const passwordFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">Password <span className="text-destructive">*</span></label>
        <PasswordInput id="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" required disabled={loading} />
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password <span className="text-destructive">*</span></label>
        <PasswordInput id="confirmPassword" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11" required disabled={loading} />
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
        <label htmlFor="telephone" className="text-sm font-medium">Telephone Number <span className="text-destructive">*</span></label>
        <Input id="telephone" type="tel" placeholder="+1 (302) 538-9413" value={telephone} onChange={(e) => setTelephone(formatPhoneInput(e.target.value))} className="h-11" required disabled={loading} />
        <p className="text-xs text-muted-foreground">Format: +1 (XXX) XXX-XXXX</p>
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

  // --- Email verification step ---
  const emailVerificationStep = (
    <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
      {stepHeader("Email Verification")}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-accent" />
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
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>Verification email will be sent upon account creation</span>
          </div>
        </div>
        {navButtons(true)}
      </form>
      {signInLink}
    </div>
  );

  const businessFormFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label htmlFor="businessName" className="text-sm font-medium">Name of Business <span className="text-destructive">*</span></label>
        <Input id="businessName" type="text" placeholder="Enter business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="h-11" required disabled={loading} />
      </div>
      <div className="space-y-2">
        <label htmlFor="businessCategory" className="text-sm font-medium">Business Category <span className="text-destructive">*</span></label>
        <Select value={businessCategory} onValueChange={setBusinessCategory} disabled={loading}>
          <SelectTrigger id="businessCategory" className="h-11">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const individualFormFields = (
    <>
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
    </>
  );

  const renderSignupFormSteps = () => {
    if (signupStep === 2) {
      return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 space-y-6">
          {stepHeader(accountType === "individual" ? "Personal Information" : "Business Information")}
          <div className="space-y-5">
            {accountType === "business" && businessFormFields}
            {accountType === "individual" && individualFormFields}
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
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <Button variant="ghost" onClick={() => navigate("/directory")} className="absolute top-4 left-4 z-10">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Directory
      </Button>
      <div className={cn("w-full", isSignUp && signupStep >= 2 ? "max-w-lg" : "max-w-md")}>
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
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setAccountType(type.value)}
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
                );
              })}
            </div>

            <Button
              type="button"
              onClick={handleNextStep}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-medium text-base rounded-md"
            >
              Next
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <button type="button" onClick={() => setIsSignUp(false)} className="text-accent hover:underline font-medium">
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
              <button type="button" onClick={() => { setIsForgotPassword(false); setEmail(""); }} className="text-accent hover:underline font-medium">
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
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-accent hover:underline">Forgot password?</button>
                  </div>
                  <PasswordInput id="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" required disabled={loading} />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-medium text-base rounded-md" disabled={loading}>
                {loading ? "Please wait..." : "Sign In"}
              </Button>
            </form>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <button type="button" onClick={() => { setIsSignUp(true); setSignupStep(1); setPassword(""); }} className="text-accent hover:underline font-medium">
                Sign up here
              </button>
            </div>
          </div>
        )}

        {isSignUp && signupStep === 1 && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-accent hover:underline">Terms of Service</a>{" "}and{" "}
            <a href="#" className="text-accent hover:underline">Privacy Policy</a>
          </p>
        )}
      </div>
    </div>
  );
}
