import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(true);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const createAppointment = async () => {
      console.log("[BookingSuccess] Starting appointment creation", { 
        authLoading, 
        hasUser: !!user, 
        sessionId 
      });

      // Wait for auth to load
      if (authLoading) {
        console.log("[BookingSuccess] Waiting for auth to load...");
        return;
      }

      // Check if user is authenticated
      if (!user) {
        console.log("[BookingSuccess] No user found, redirecting to auth");
        toast({
          title: "Authentication Required",
          description: "Please sign in to view your booking.",
          variant: "destructive",
        });
        navigate("/auth", { state: { returnTo: `/booking/success?session_id=${sessionId}` } });
        return;
      }

      if (!sessionId) {
        console.log("[BookingSuccess] No session ID found");
        toast({
          title: "Error",
          description: "No session ID found. Please try booking again.",
          variant: "destructive",
        });
        navigate("/discover");
        return;
      }

      try {
        console.log("✅ [BookingSuccess] Starting verification with session ID:", sessionId);
        console.log("📞 [BookingSuccess] Calling verify-booking-payment edge function...");
        
        // Call edge function to verify payment and get session details
        const { data, error } = await supabase.functions.invoke("verify-booking-payment", {
          body: { session_id: sessionId },
        });

        console.log("📦 [BookingSuccess] Function response received:", { data, error });

        if (error) {
          console.error("[BookingSuccess] Function error:", error);
          throw error;
        }

        if (data.success) {
          console.log("[BookingSuccess] Booking confirmed successfully");
          toast({
            title: "Booking Confirmed!",
            description: "Your card has been authorized and your appointment is secured.",
          });
          setProcessing(false);
        } else {
          console.error("[BookingSuccess] Payment verification failed", data);
          throw new Error("Payment verification failed");
        }
      } catch (error) {
        console.error("[BookingSuccess] Error processing booking:", error);
        toast({
          title: "Booking Error",
          description: "There was an error confirming your booking. Please contact support.",
          variant: "destructive",
        });
        setProcessing(false);
      }
    };

    createAppointment();
  }, [sessionId, navigate, toast, user, authLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        {processing || authLoading ? (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
            <h1 className="text-2xl font-bold mb-2">Processing Your Booking...</h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your authorization and create your appointment.
            </p>
          </>
        ) : (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-foreground" />
            <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground mb-2">
              Your card has been authorized and your appointment is secured.
            </p>
            <div className="bg-muted border border-border rounded-xl p-3 mb-6 text-sm text-muted-foreground shadow-sm">
              <p className="font-semibold mb-1">💳 Payment at Venue</p>
              <p>Your card authorization ensures your booking. You'll pay at the venue after your service. The hold is only captured for late cancellations or no-shows.</p>
            </div>
            <div className="space-y-2">
              <Button 
                className="w-full" 
                onClick={() => navigate("/account?tab=bookings")}
              >
                View My Bookings
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/discover")}
              >
                Continue Browsing
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
