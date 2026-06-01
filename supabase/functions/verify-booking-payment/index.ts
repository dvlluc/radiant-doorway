import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("[VERIFY-BOOKING-PAYMENT] ===== Function invoked =====");
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseClient.auth.getUser(token);
    const user = authData.user;
    console.log("[VERIFY-BOOKING-PAYMENT] User authenticated:", user?.id);
    if (!user) throw new Error("User not authenticated");

    const { session_id } = await req.json();
    console.log("[VERIFY-BOOKING-PAYMENT] Session ID received:", session_id);
    if (!session_id) throw new Error("Session ID is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Retrieve the session to verify payment
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent']
    });
    
    console.log("[VERIFY-BOOKING-PAYMENT] Session details:", {
      payment_status: session.payment_status,
      payment_intent_status: session.payment_intent
    });
    
    // For authorization holds (manual capture), check if payment_intent is authorized
    // payment_status will be "unpaid" but payment_intent.status will be "requires_capture"
    const paymentIntent = session.payment_intent as any;
    const isAuthorized = paymentIntent?.status === "requires_capture";
    const isPaid = session.payment_status === "paid";
    
    if (!isAuthorized && !isPaid) {
      throw new Error("Payment authorization failed. Status: " + (paymentIntent?.status || session.payment_status));
    }
    
    console.log("[VERIFY-BOOKING-PAYMENT] Payment verified:", { isAuthorized, isPaid });

    // Extract booking details from metadata
    const metadata = session.metadata;
    if (!metadata) throw new Error("No booking metadata found");

    // Parse time string and combine with date
    const date = metadata.date;
    const time = metadata.time;
    const [timeStr, period] = time.split(' ');
    let [hours, minutes] = timeStr.split(':').map(Number);
    
    if (period.toLowerCase() === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period.toLowerCase() === 'am' && hours === 12) {
      hours = 0;
    }

    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);

    // Calculate end time based on total duration
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + parseInt(metadata.total_duration));

    // Create appointment in database
    const { data: appointment, error: insertError } = await supabaseClient
      .from('appointments')
      .insert({
        user_id: metadata.business_id,
        customer_id: user.id,
        staff_member_id: metadata.professional_id || null,
        title: metadata.service_names,
        description: `Appointment at ${metadata.business_name}`,
        service_type: metadata.service_names.split(',')[0].trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        color: '#10b981'
      })
      .select('*')
      .single();

    if (insertError || !appointment) {
      console.error("[VERIFY-BOOKING-PAYMENT] Error creating appointment:", insertError);
      throw insertError;
    }

    console.log("[VERIFY-BOOKING-PAYMENT] Appointment created successfully:", appointment.id);

    // Get customer details
    const { data: customer } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    // Get staff member details
    let staffFirstName = 'our team';
    if (metadata.professional_id) {
      const { data: staffProfile } = await supabaseClient
        .from('profiles')
        .select('first_name')
        .eq('id', metadata.professional_id)
        .single();
      
      if (staffProfile?.first_name) {
        staffFirstName = staffProfile.first_name;
      }
    }

    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send confirmation email
    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

      await resend.emails.send({
        from: "BelloNecta <onboarding@resend.dev>",
        to: [customer?.email || user.email || ''],
        subject: `Booking Confirmed - ${metadata.business_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Booking Confirmed!</h1>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin-top: 0;">Appointment Details</h2>
              <p><strong>Business:</strong> ${metadata.business_name}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${time}</p>
              <p><strong>Duration:</strong> ${metadata.total_duration} minutes</p>
              <p><strong>Services:</strong> ${metadata.service_names}</p>
              <p><strong>Professional:</strong> ${staffFirstName}</p>
            </div>

            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;"><strong>💳 Payment Information</strong></p>
              <p style="margin: 10px 0 0 0; color: #1e40af;">Your card has been authorized. You'll pay at the venue after your service. The hold will only be captured for late cancellations or no-shows.</p>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Thank you for booking with ${metadata.business_name}. We look forward to seeing you!
            </p>
          </div>
        `,
      });

      console.log("[VERIFY-BOOKING-PAYMENT] Confirmation email sent");
    } catch (emailError) {
      console.error("[VERIFY-BOOKING-PAYMENT] Error sending email:", emailError);
      // Don't fail the booking if email fails
    }

    return new Response(
      JSON.stringify({ success: true, message: "Booking confirmed" }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[VERIFY-BOOKING-PAYMENT] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
