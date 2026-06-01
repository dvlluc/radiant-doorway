import { supabase } from "@/integrations/supabase/client";

export class BookingForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingForbiddenError";
  }
}

export class TimeSlotUnavailableError extends Error {
  constructor(message = "This time is no longer available.") {
    super(message);
    this.name = "TimeSlotUnavailableError";
  }
}

export async function resolveAccountType(userId: string): Promise<string> {
  const { data } = await supabase
    .from("user_roles")
    .select("account_type")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.account_type || "individual";
}

export async function assertCanBookBusinessService(
  customerId: string,
  businessId: string
): Promise<void> {
  const accountType = await resolveAccountType(customerId);

  if (accountType !== "individual") {
    throw new BookingForbiddenError(
      "Only individual accounts can book services from businesses."
    );
  }

  if (customerId === businessId) {
    throw new BookingForbiddenError("You cannot book your own business.");
  }

  const { data: business } = await supabase
    .from("business_profiles")
    .select("user_id")
    .eq("user_id", businessId)
    .maybeSingle();

  if (!business) {
    throw new BookingForbiddenError("Business not found.");
  }
}

export interface CreateBookingAppointmentInput {
  businessId: string;
  businessName?: string;
  staffAuthId?: string | null;
  startTime: string;
  endTime: string;
  serviceName: string;
  specialRequests?: string | null;
  hairPhotoUrl?: string | null;
  cartItemId?: string | null;
}

async function hasSlotConflict(
  businessId: string,
  staffAuthId: string | null,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("get_staff_busy_slots", {
    p_business_id: businessId,
    p_staff_auth_id: staffAuthId,
    p_range_start: startTime,
    p_range_end: endTime,
  });

  if (error) {
    console.error("get_staff_busy_slots:", error);
    throw error;
  }

  return Boolean(data?.length);
}

export async function createBookingAppointment(
  input: CreateBookingAppointmentInput
): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  await assertCanBookBusinessService(user.id, input.businessId);

  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error("Invalid appointment time range");
  }

  const startIso = start.toISOString();
  const endIso = end.toISOString();

  if (
    await hasSlotConflict(
      input.businessId,
      input.staffAuthId ?? null,
      startIso,
      endIso
    )
  ) {
    throw new TimeSlotUnavailableError();
  }

  const descriptionParts = [
    input.businessName ? `Appointment at ${input.businessName}` : null,
    input.specialRequests?.trim() || null,
    input.hairPhotoUrl ? `Hair photo: ${input.hairPhotoUrl}` : null,
  ].filter(Boolean);

  const { data: appointment, error: insertError } = await supabase
    .from("appointments")
    .insert({
      user_id: input.businessId,
      customer_id: user.id,
      staff_member_id: input.staffAuthId || null,
      title: input.serviceName,
      description: descriptionParts.join("\n") || null,
      service_type: input.serviceName,
      start_time: startIso,
      end_time: endIso,
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
      throw new TimeSlotUnavailableError();
    }
    throw insertError;
  }

  if (input.cartItemId) {
    await supabase.from("cart_items").delete().eq("id", input.cartItemId).eq("user_id", user.id);
  }

  return appointment.id;
}
