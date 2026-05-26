import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-IN-APPOINTMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { appointmentId, qrCode, checkIn } = await req.json();
    
    if (!appointmentId && !qrCode) {
      throw new Error("Either appointment ID or QR code is required");
    }

    logStep("Looking up appointment", { appointmentId, qrCode });

    // Build query based on what was provided
    let query = supabaseClient
      .from("appointments")
      .select(`
        *,
        profiles!appointments_customer_id_fkey (
          first_name,
          last_name,
          email
        )
      `);

    if (qrCode) {
      query = query.eq("qr_code", qrCode);
    } else {
      query = query.eq("id", appointmentId);
    }

    const { data: appointment, error: appointmentError } = await query.maybeSingle();

    if (appointmentError || !appointment) {
      logStep("Appointment not found", { error: appointmentError });
      return new Response(JSON.stringify({ 
        valid: false,
        message: "Invalid appointment"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user is authorized (business owner or staff member)
    const isBusinessOwner = appointment.user_id === user.id;
    const isStaffMember = appointment.staff_member_id === user.id;
    
    if (!isBusinessOwner && !isStaffMember) {
      throw new Error("Not authorized to check in appointments for this business");
    }

    // If checking in
    if (checkIn && appointment.status !== "completed" && appointment.status !== "cancelled") {
      const { error: updateError } = await supabaseClient
        .from("appointments")
        .update({ 
          status: "arrived",
          checked_in_at: new Date().toISOString(),
          checked_in_by: user.id
        })
        .eq("id", appointment.id);

      if (updateError) {
        logStep("Error checking in appointment", { error: updateError });
        throw updateError;
      }

      logStep("Appointment checked in - status set to arrived", { appointmentId: appointment.id });
      
      return new Response(JSON.stringify({ 
        valid: true,
        message: "Client checked in successfully",
        appointment: { 
          ...appointment, 
          status: "arrived",
          checked_in_at: new Date().toISOString() 
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      valid: true,
      appointment,
      canCheckIn: appointment.status !== "completed" && appointment.status !== "cancelled",
      alreadyCheckedIn: appointment.checked_in_at !== null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-in-appointment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
