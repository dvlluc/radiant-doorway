import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[APPOINTMENT-REMINDERS] ${step}${detailsStr}`);
};

// Format phone number to E.164 format
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it doesn't start with +, assume US and add +1
  if (!phone.startsWith('+')) {
    return `+1${cleaned}`;
  }
  
  return `+${cleaned}`;
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
    logStep("Starting appointment reminder check");

    // Calculate the time window for 48 hours from now (47.5 to 48.5 hours to catch appointments)
    const now = new Date();
    const reminderStart = new Date(now.getTime() + (47.5 * 60 * 60 * 1000));
    const reminderEnd = new Date(now.getTime() + (48.5 * 60 * 60 * 1000));

    logStep("Time window", { 
      reminderStart: reminderStart.toISOString(), 
      reminderEnd: reminderEnd.toISOString() 
    });

    // Find appointments that need reminders
    const { data: appointments, error: appointmentsError } = await supabaseClient
      .from('appointments')
      .select(`
        id,
        start_time,
        title,
        customer_id,
        user_id,
        service_type
      `)
      .eq('status', 'scheduled')
      .is('reminder_sent_at', null)
      .gte('start_time', reminderStart.toISOString())
      .lte('start_time', reminderEnd.toISOString());

    if (appointmentsError) {
      logStep("Error fetching appointments", { error: appointmentsError });
      throw appointmentsError;
    }

    logStep(`Found ${appointments?.length || 0} appointments needing reminders`);

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No appointments need reminders at this time",
        count: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let successCount = 0;
    let failCount = 0;

    // Process each appointment
    for (const appointment of appointments) {
      try {
        // Get customer profile with phone number
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('first_name, last_name, telephone')
          .eq('id', appointment.customer_id)
          .single();

        if (profileError || !profile?.telephone) {
          logStep(`Skipping appointment ${appointment.id} - no phone number`);
          continue;
        }

        // Get business profile for business name
        const { data: businessProfile, error: businessError } = await supabaseClient
          .from('business_profiles')
          .select('business_name')
          .eq('user_id', appointment.user_id)
          .single();

        const businessName = businessProfile?.business_name || 'your appointment';

        // Format the appointment date/time
        const appointmentDate = new Date(appointment.start_time);
        const formattedDate = appointmentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        // Create SMS message
        const message = `Hi ${profile.first_name}! Reminder: You have an appointment with ${businessName} on ${formattedDate} at ${formattedTime}. See you soon!`;

        // Send SMS via Twilio
        const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
        const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const formattedPhone = formatPhoneNumber(profile.telephone);

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: formattedPhone,
            From: twilioPhoneNumber!,
            Body: message,
          }),
        });

        if (!twilioResponse.ok) {
          const errorData = await twilioResponse.text();
          logStep(`Failed to send SMS for appointment ${appointment.id}`, { 
            status: twilioResponse.status,
            error: errorData 
          });
          failCount++;
          continue;
        }

        logStep(`SMS sent successfully for appointment ${appointment.id}`, {
          to: formattedPhone,
          appointmentTime: appointment.start_time
        });

        // Mark reminder as sent
        const { error: updateError } = await supabaseClient
          .from('appointments')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', appointment.id);

        if (updateError) {
          logStep(`Error updating reminder_sent_at for ${appointment.id}`, { error: updateError });
        }

        successCount++;

      } catch (error) {
        logStep(`Error processing appointment ${appointment.id}`, { 
          error: error instanceof Error ? error.message : String(error) 
        });
        failCount++;
      }
    }

    logStep("Reminder processing complete", { 
      total: appointments.length, 
      success: successCount, 
      failed: failCount 
    });

    return new Response(JSON.stringify({ 
      message: "Reminders processed",
      total: appointments.length,
      success: successCount,
      failed: failCount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-appointment-reminders", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
