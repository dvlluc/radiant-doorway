import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders, handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";

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

async function resolveAccountType(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string> {
  const { data } = await supabase
    .from("user_roles")
    .select("account_type")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.account_type || "individual";
}

serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "No authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }

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
      return jsonResponse({ error: "Missing required booking fields" }, 400);
    }

    const accountType = await resolveAccountType(supabase, user.id);
    if (accountType !== "individual") {
      return jsonResponse(
        {
          error: "FORBIDDEN",
          message: "Only individual accounts can book business services.",
        },
        403
      );
    }

    if (businessId === user.id) {
      return jsonResponse(
        { error: "FORBIDDEN", message: "You cannot book your own business." },
        403
      );
    }

    const { data: businessProfile } = await supabase
      .from("business_profiles")
      .select("user_id")
      .eq("user_id", businessId)
      .maybeSingle();

    if (!businessProfile) {
      return jsonResponse({ error: "Business not found" }, 404);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return jsonResponse({ error: "Invalid appointment time range" }, 400);
    }

    const { data: conflicts, error: conflictError } = await supabase.rpc("get_staff_busy_slots", {
      p_business_id: businessId,
      p_staff_auth_id: staffAuthId ?? null,
      p_range_start: start.toISOString(),
      p_range_end: end.toISOString(),
    });

    if (conflictError) {
      console.error("[BOOK-APPOINTMENT] conflict check:", conflictError);
      return jsonResponse({ error: conflictError.message }, 500);
    }

    if (conflicts && conflicts.length > 0) {
      return jsonResponse(
        { error: "TIME_SLOT_UNAVAILABLE", message: "This time is no longer available." },
        409
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
      if (
        insertError.message?.includes("TIME_SLOT_UNAVAILABLE") ||
        insertError.code === "P0001"
      ) {
        return jsonResponse(
          { error: "TIME_SLOT_UNAVAILABLE", message: "This time is no longer available." },
          409
        );
      }
      console.error("[BOOK-APPOINTMENT] insert:", insertError);
      return jsonResponse({ error: insertError.message }, 500);
    }

    if (cartItemId) {
      await supabase.from("cart_items").delete().eq("id", cartItemId).eq("user_id", user.id);
    }

    return jsonResponse({ appointmentId: appointment.id }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed";
    console.error("[BOOK-APPOINTMENT]", message);
    return jsonResponse({ error: message }, 500);
  }
});
