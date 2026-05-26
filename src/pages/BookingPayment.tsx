import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Shield } from "lucide-react";
import { format, parse } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrencyFromLocation } from "@/utils/currency";

export default function BookingPayment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const { 
    services = [], 
    date, 
    time, 
    professional, 
    professionalId,
    businessId,
    businessName,
    specialRequests,
    hairPhotoUrl,
  } = location.state || {};
  
  // Get currency based on professional's location (defaulting to USD if not available)
  const professionalLocation = professional?.location || "United States";
  const currency = getCurrencyFromLocation(professionalLocation);
  
  const [addDonation, setAddDonation] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [depositSettings, setDepositSettings] = useState<{
    enabled: boolean;
    percentage: number;
    refundHours: number;
  }>({ enabled: false, percentage: 0, refundHours: 24 });
  const [isSoloBusiness, setIsSoloBusiness] = useState<boolean>(true);

  const PLATFORM_FEE_RATE = 0.045; // 4.5% BelloNecta fee
  const STRIPE_PCT = 0.029;
  const STRIPE_FIXED = 0.30;

  const totalDuration = services.reduce((sum: number, s: any) => sum + s.duration, 0);
  const totalPrice = services.reduce((sum: number, s: any) => sum + s.price, 0);
  // Deposit applies only for multi-staff businesses
  const depositRequired = !isSoloBusiness && depositSettings.percentage > 0;
  const depositAmount = depositRequired
    ? +(totalPrice * depositSettings.percentage / 100).toFixed(2)
    : 0;
  const platformFee = depositRequired ? +(depositAmount * PLATFORM_FEE_RATE).toFixed(2) : 0;
  // Gross-up Stripe fee so business receives deposit + platform fee in full
  const subBeforeStripe = depositAmount + platformFee;
  const processingFee = depositRequired
    ? +((subBeforeStripe + STRIPE_FIXED) / (1 - STRIPE_PCT) - subBeforeStripe).toFixed(2)
    : 0;
  const dueNow = +(depositAmount + platformFee + processingFee).toFixed(2);
  const remainingBalance = +(totalPrice - depositAmount).toFixed(2);

  // Check authentication and booking data on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if required booking data exists
        if (!services.length || !date || !time) {
          toast({
            title: "Missing Booking Information",
            description: "Please select your services and time slot first.",
            variant: "destructive",
          });
          navigate(`/booking/${id}`);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to complete your booking.",
            variant: "destructive",
          });
          navigate("/auth", { state: { returnTo: `/booking/${id}/payment` } });
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check error:", error);
        toast({
          title: "Error",
          description: "Failed to verify authentication. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Load business deposit / refund policy + active staff count
    const targetBizId = businessId || id;
    if (targetBizId) {
      supabase
        .from("business_settings")
        .select("deposit_enabled, deposit_percentage, refund_policy_hours")
        .eq("user_id", targetBizId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setDepositSettings({
              enabled: !!(data as any).deposit_enabled,
              percentage: Number((data as any).deposit_percentage ?? 0),
              refundHours: Number((data as any).refund_policy_hours ?? 24),
            });
          }
        });

      (supabase as any)
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", targetBizId)
        .neq("status", "terminated")
        .then(({ count }: { count: number | null }) => {
          setIsSoloBusiness((count ?? 0) === 0);
        });
    }
  }, [id, navigate, toast, services, date, time, businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || isProcessing) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Validate booking data before creating checkout
      if (!date || !time || !services.length) {
        toast({
          title: "Invalid Booking Data",
          description: "Please go back and complete your booking selection.",
          variant: "destructive",
        });
        navigate(`/booking/${id}`);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Please sign in to book an appointment.",
          variant: "destructive",
        });
        return;
      }

      console.log("Creating checkout session with data:", {
        services,
        totalPrice,
        businessId: businessId || id,
        professionalId,
        businessName,
        date: date.toISOString(),
        time,
        totalDuration,
        currency: currency.code,
      });

      // Call edge function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke("create-booking-payment", {
        body: {
          services,
          totalPrice,
          businessId: businessId || id,
          professionalId,
          businessName,
          date: date.toISOString(),
          time,
          totalDuration,
          currency: currency.code,
          specialRequests: specialRequests || null,
          hairPhotoUrl: hairPhotoUrl || null,
          depositRequired,
          depositAmount,
          platformFee,
          processingFee,
          dueNow,
          depositPercentage: depositSettings.percentage,
        },
      });

      console.log("Edge function response:", { data, error });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (data?.url) {
        console.log("✅ Stripe checkout URL received:", data.url);
        
        // Validate URL format
        if (!data.url.startsWith('http')) {
          console.error("❌ Invalid URL format:", data.url);
          throw new Error("Invalid checkout URL format");
        }
        
        console.log("🔄 Opening Stripe checkout...");
        
        toast({
          title: "Opening Secure Checkout",
          description: "A new window will open for payment...",
        });
        
        // Try to open in new window first (more reliable for Stripe)
        const stripeWindow = window.open(data.url, '_blank');
        
        if (!stripeWindow || stripeWindow.closed || typeof stripeWindow.closed === 'undefined') {
          // Popup blocked - fallback to same window redirect
          console.log("⚠️ Popup blocked, redirecting in same window...");
          toast({
            title: "Redirecting...",
            description: "Opening payment page...",
          });
          setTimeout(() => {
            window.location.href = data.url;
          }, 500);
        } else {
          console.log("✅ Stripe checkout opened in new window");
        }
      } else {
        console.error("❌ No checkout URL in response:", data);
        throw new Error("No checkout URL received from payment service");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "There was an error creating your checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 text-center">
        <p>Loading payment details...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Booking Summary & Charity */}
        <div className="lg:col-span-1">
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">BOOKING SUMMARY</h3>

            {businessName && (
              <div className="mb-4 pb-4 border-b">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Business
                </h4>
                <p className="font-semibold">{businessName}</p>
              </div>
            )}

            {professional && (
              <div className="mb-4 pb-4 border-b">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Professional
                </h4>
                <p className="font-semibold">
                  {professional.profile?.first_name || professional.email?.split('@')[0] || 'Professional'}
                </p>
                {professional.title && (
                  <p className="text-xs text-muted-foreground">{professional.title}</p>
                )}
              </div>
            )}

            {date && time && (
              <div className="mb-4 pb-4 border-b">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Date & Time
                </h4>
                <p className="font-semibold">{format(date, "EEEE, MMMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground">{time}</p>
              </div>
            )}

            <div className="mb-4 pb-4 border-b">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Duration
              </h4>
              <p className="font-semibold">{totalDuration} minutes</p>
            </div>

            <div className="mb-6 pb-4 border-b">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Services
              </h4>
              <div className="space-y-2">
                {services.map((service: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{service.name}</span>
                    <span className="font-semibold">{currency.symbol}{service.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 pb-4 border-b space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Booking Total</span>
                <span className="font-semibold">{currency.symbol}{totalPrice.toFixed(2)}</span>
              </div>
              {depositRequired ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deposit ({depositSettings.percentage}%)</span>
                    <span className="font-semibold">{currency.symbol}{depositAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service fee (4.5%)</span>
                    <span className="font-semibold">{currency.symbol}{platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing fee</span>
                    <span className="font-semibold">{currency.symbol}{processingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-start pt-2 border-t">
                    <span className="text-sm font-medium">Due now</span>
                    <span className="font-bold text-lg">{currency.symbol}{dueNow.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining balance at venue</span>
                    <span className="font-semibold">{currency.symbol}{remainingBalance.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-start pt-1">
                  <span className="text-sm font-medium text-muted-foreground">Authorization Hold:</span>
                  <div className="text-right">
                    <p className="font-bold text-lg">{currency.symbol}{totalPrice.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Payment at venue</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted border border-border rounded-xl p-3 text-xs text-muted-foreground space-y-2 shadow-sm">
              {depositRequired ? (
                <>
                  <p className="font-semibold">💳 Deposit Required</p>
                  <p>A {depositSettings.percentage}% deposit plus a 4.5% service fee and card processing fee is charged today. The remaining {currency.symbol}{remainingBalance.toFixed(2)} is paid at the venue.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">💳 Card Authorization</p>
                  <p>Your card will be authorized (not charged) to secure your booking. Payment is made in full at the venue — no deposit required.</p>
                </>
              )}
              <p className="pt-1 border-t border-blue-200">
                <span className="font-semibold">Refund policy:</span> Free cancellation up to {depositSettings.refundHours} hours before your booking.
              </p>
            </div>
          </Card>

          {/* Charitable Donation */}
          <Card className="p-6 border-2 opacity-60">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💚</span>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">
                  SUPPORT OUR CHARITABLE PARTNERS (COMING SOON)
                </h3>
                <div className="bg-muted border border-border p-4 rounded-xl mb-3 shadow-sm">
                  <p className="text-sm mb-2">
                    Add a donation to support a charitable cause or sustainable beauty
                  </p>
                  <p className="text-xs text-muted-foreground">
                    100% of donations go directly to our charitable partners
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="donation"
                    checked={false}
                    disabled
                  />
                  <Label htmlFor="donation" className="cursor-not-allowed text-muted-foreground">
                    Yes, I'd like to add a donation to my booking
                  </Label>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side - Payment Information */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              💳 {depositRequired ? "DEPOSIT PAYMENT" : "CARD AUTHORIZATION"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {depositRequired ? (
                <div className="bg-muted border border-border rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold text-foreground mb-2">💳 Deposit charged today</h4>
                  <p className="text-sm text-muted-foreground">
                    A <strong>{currency.symbol}{dueNow.toFixed(2)}</strong> deposit (including service & processing fees) will be charged to your card now to secure your booking. The remaining <strong>{currency.symbol}{remainingBalance.toFixed(2)}</strong> is paid at the venue.
                  </p>
                </div>
              ) : (
                <div className="bg-muted border border-border rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold text-foreground mb-2">⚠️ Authorization Hold Only</h4>
                  <p className="text-sm text-muted-foreground">
                    We will place an authorization hold on your card to secure your booking.
                    <strong> You will NOT be charged now.</strong> Payment is made in full at the venue after your service.
                  </p>
                </div>
              )}

              <div className="bg-muted border border-border rounded-xl p-4 shadow-sm">
                <h4 className="font-semibold text-foreground mb-2">💳 Secure Stripe Checkout</h4>
                <p className="text-sm text-muted-foreground">
                  Your card details are securely processed through Stripe with bank-level encryption.
                </p>
              </div>

              <div className="bg-muted border border-border rounded-xl p-4 shadow-sm">
                <h4 className="font-semibold text-foreground mb-2">✓ What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>1. You'll be redirected to Stripe's secure page</li>
                  <li>2. {depositRequired ? "Pay the deposit to confirm your booking" : "Enter your card details (authorization only - no charge)"}</li>
                  <li>3. Receive booking confirmation</li>
                  <li>4. Pay the remaining balance at the venue</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Your card information is secure and encrypted by Stripe
              </p>
            </form>

            <Button
              type="button"
              className="w-full bg-black hover:bg-black/90 text-white mt-6 mb-3"
              onClick={handleSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? "Opening Authorization..." : "Proceed to Payment"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You'll be redirected to Stripe for secure card authorization
            </p>

            <div className="mt-4 pt-4 border-t text-xs text-center text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms and Conditions
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
