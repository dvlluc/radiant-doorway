import { supabase } from "@/integrations/supabase/client";

const NON_CANCELLABLE_STATUSES = new Set([
  "cancelled",
  "no-show",
  "refunded",
  "removed",
  "completed",
  "waiting",
]);

export function isAppointmentCancellable(status: string) {
  const normalized = status.toLowerCase().replace(/_/g, "-");
  return !NON_CANCELLABLE_STATUSES.has(normalized);
}

export async function cancelAppointmentAsCustomer(
  appointmentId: string,
  reason?: string
) {
  const { error } = await supabase.rpc("cancel_customer_appointment", {
    p_appointment_id: appointmentId,
    p_reason: reason?.trim() || null,
  });

  if (error) throw error;
}

export async function cancelAppointmentAsStaff(
  appointmentId: string,
  reason?: string
) {
  const { error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      description: reason ? `Cancelled: ${reason}` : "Cancelled by staff",
    })
    .eq("id", appointmentId);

  if (error) throw error;
}

export async function promoteWaitingListAfterCancellation(appointmentId: string) {
  const { data: aptData, error: fetchError } = await supabase
    .from("appointments")
    .select("user_id, staff_member_id, start_time")
    .eq("id", appointmentId)
    .single();

  if (fetchError || !aptData) {
    throw fetchError ?? new Error("Appointment not found");
  }

  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("business_name")
    .eq("user_id", aptData.user_id)
    .single();

  const startDate = new Date(aptData.start_time);
  const date = startDate.toISOString().split("T")[0];
  const hours = startDate.getHours();
  const minutes = startDate.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const time = `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;

  await supabase.functions.invoke("promote-waiting-list", {
    body: {
      cancelled_appointment_id: appointmentId,
      business_id: aptData.user_id,
      staff_member_id: aptData.staff_member_id,
      date,
      time,
      business_name: businessProfile?.business_name || "Business",
    },
  });
}
