import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportEmailRequest {
  fullName: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  priority: string;
}

// HTML escape function to prevent XSS
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Validation function
const validateInput = (data: SupportEmailRequest): { valid: boolean; error?: string } => {
  if (!data.fullName || data.fullName.trim().length === 0 || data.fullName.length > 200) {
    return { valid: false, error: "Full name must be between 1 and 200 characters" };
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 254) {
    return { valid: false, error: "Invalid email address" };
  }
  if (!data.subject || data.subject.trim().length === 0 || data.subject.length > 500) {
    return { valid: false, error: "Subject must be between 1 and 500 characters" };
  }
  if (!data.category || data.category.trim().length === 0 || data.category.length > 100) {
    return { valid: false, error: "Category must be between 1 and 100 characters" };
  }
  if (!data.message || data.message.trim().length === 0 || data.message.length > 5000) {
    return { valid: false, error: "Message must be between 1 and 5000 characters" };
  }
  if (!data.priority || data.priority.trim().length === 0 || data.priority.length > 50) {
    return { valid: false, error: "Priority must be between 1 and 50 characters" };
  }
  return { valid: true };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    const { fullName, email, subject, category, message, priority }: SupportEmailRequest = rawData;

    // Validate input
    const validation = validateInput({ fullName, email, subject, category, message, priority });
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    console.log("Sending support email:", { fullName, email, subject, category, priority });

    // Send email to support team
    const supportEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BelloNecta Support <onboarding@resend.dev>",
        to: ["support@bellonecta.com"],
        reply_to: email,
        subject: `[${priority}] ${category}: ${subject}`,
        html: `
          <h2>New Support Request</h2>
          <p><strong>From:</strong> ${escapeHtml(fullName)} (${escapeHtml(email)})</p>
          <p><strong>Category:</strong> ${escapeHtml(category)}</p>
          <p><strong>Priority:</strong> ${escapeHtml(priority)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <hr />
          <h3>Message:</h3>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        `,
      }),
    });

    const supportEmailData = await supportEmailResponse.json();

    if (!supportEmailResponse.ok) {
      console.error("Resend API error (support):", supportEmailData);
      throw new Error(supportEmailData.message || "Failed to send email to support");
    }

    // Send confirmation email to user
    const confirmationEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BelloNecta Support <onboarding@resend.dev>",
        to: [email],
        subject: "We received your support request",
        html: `
          <h2>Thank you for contacting us, ${escapeHtml(fullName)}!</h2>
          <p>We have received your support request and will get back to you within 24 hours.</p>
          <p><strong>Your request details:</strong></p>
          <ul>
            <li><strong>Subject:</strong> ${escapeHtml(subject)}</li>
            <li><strong>Category:</strong> ${escapeHtml(category)}</li>
            <li><strong>Priority:</strong> ${escapeHtml(priority)}</li>
          </ul>
          <p>Best regards,<br>BelloNecta Support Team</p>
        `,
      }),
    });

    const confirmationEmailData = await confirmationEmailResponse.json();

    if (!confirmationEmailResponse.ok) {
      console.error("Resend API error (confirmation):", confirmationEmailData);
      // Don't throw here, as the main email was sent successfully
    }

    console.log("Support emails sent successfully");

    return new Response(JSON.stringify({ success: true, data: supportEmailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in support-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
