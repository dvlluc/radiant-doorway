import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookAppointmentBody {
  businessId: string;
  businessName?: string;
  staffAuthId?: string | null;
  startTime: string;
  endTime: string;
  serviceName: string;
  serviceId?: string;
  specialRequests?: string | null;
  hairPhotoUrl?: string | null;
  cartItemId?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const user = userData.user;
    const body = (await req.json()) as BookAppointmentBody;

    const {
      businessId,
      businessName,
      staffAuthId,
      startTime,
      endTime,
      serviceName,
      specialRequests,
      hairPhotoUrl,
      cartItemId,
    } = body;

    if (!businessId || !startTime || !endTime || !serviceName) {
      throw new Error("Missing required booking fields");
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new Error("Invalid appointment time range");
    }

    const { data: conflicts, error: conflictError } = await supabase.rpc("get_staff_busy_slots", {
      p_business_id: businessId,
      p_staff_auth_id: staffAuthId ?? null,
      p_range_start: start.toISOString(),
      p_range_end: end.toISOString(),
    });

    if (conflictError) throw conflictError;
    if (conflicts && conflicts.length > 0) {
      return new Response(
        JSON.stringify({ error: "TIME_SLOT_UNAVAILABLE", message: "This time is no longer available." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const descriptionParts = [
      businessName ? `Appointment at ${businessName}` : null,
      specialRequests?.trim() || null,
      hairPhotoUrl ? `Hair photo: ${hairPhotoUrl}` : null,
    ].filter(Boolean);

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        user_id: businessId,
        customer_id: user.id,
        staff_member_id: staffAuthId || null,
        title: serviceName,
        description: descriptionParts.join("\n") || null,
        service_type: serviceName,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: "scheduled",
        color: "#10b981",
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.message?.includes("TIME_SLOT_UNAVAILABLE")) {
        return new Response(
          JSON.stringify({ error: "TIME_SLOT_UNAVAILABLE", message: "This time is no longer available." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw insertError;
    }

    if (cartItemId) {
      await supabase.from("cart_items").delete().eq("id", cartItemId).eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify({ appointmentId: appointment.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed";
    console.error("[BOOK-APPOINTMENT]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
