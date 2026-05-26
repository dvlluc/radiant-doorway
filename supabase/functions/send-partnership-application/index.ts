import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PartnershipApplicationRequest {
  charityName: string;
  contactPerson: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  zipPostalCode: string;
  country: string;
  telephone: string;
  email: string;
  website?: string;
  registrationNumber: string;
  charityOverview: string;
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
const validateInput = (data: PartnershipApplicationRequest): { valid: boolean; error?: string } => {
  if (!data.charityName || data.charityName.trim().length === 0 || data.charityName.length > 300) {
    return { valid: false, error: "Charity name must be between 1 and 300 characters" };
  }
  if (!data.contactPerson || data.contactPerson.trim().length === 0 || data.contactPerson.length > 200) {
    return { valid: false, error: "Contact person must be between 1 and 200 characters" };
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 254) {
    return { valid: false, error: "Invalid email address" };
  }
  if (!data.telephone || data.telephone.trim().length === 0 || data.telephone.length > 50) {
    return { valid: false, error: "Telephone must be between 1 and 50 characters" };
  }
  if (!data.addressLine1 || data.addressLine1.trim().length === 0 || data.addressLine1.length > 300) {
    return { valid: false, error: "Address line 1 must be between 1 and 300 characters" };
  }
  if (data.addressLine2 && data.addressLine2.length > 300) {
    return { valid: false, error: "Address line 2 must be less than 300 characters" };
  }
  if (!data.city || data.city.trim().length === 0 || data.city.length > 200) {
    return { valid: false, error: "City must be between 1 and 200 characters" };
  }
  if (!data.stateProvince || data.stateProvince.trim().length === 0 || data.stateProvince.length > 200) {
    return { valid: false, error: "State/Province must be between 1 and 200 characters" };
  }
  if (!data.zipPostalCode || data.zipPostalCode.trim().length === 0 || data.zipPostalCode.length > 50) {
    return { valid: false, error: "ZIP/Postal code must be between 1 and 50 characters" };
  }
  if (!data.country || data.country.trim().length === 0 || data.country.length > 200) {
    return { valid: false, error: "Country must be between 1 and 200 characters" };
  }
  if (!data.registrationNumber || data.registrationNumber.trim().length === 0 || data.registrationNumber.length > 200) {
    return { valid: false, error: "Registration number must be between 1 and 200 characters" };
  }
  if (!data.charityOverview || data.charityOverview.trim().length === 0 || data.charityOverview.length > 5000) {
    return { valid: false, error: "Charity overview must be between 1 and 5000 characters" };
  }
  if (data.website && (data.website.length > 500 || !/^https?:\/\/.+/.test(data.website))) {
    return { valid: false, error: "Invalid website URL" };
  }
  return { valid: true };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: PartnershipApplicationRequest = await req.json();

    // Validate input
    const validation = validateInput(data);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error, success: false }),
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
    
    console.log("Received partnership application from:", data.charityName);

    // Build address string
    const fullAddress = [
      data.addressLine1,
      data.addressLine2,
      data.city,
      data.stateProvince,
      data.zipPostalCode,
      data.country
    ].filter(Boolean).join(", ");

    // Send email to BelloNecta
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BelloNecta Partnership <onboarding@resend.dev>",
        to: ["support@bellonecta.com"],
        reply_to: data.email,
        subject: `New Bello Partnership Application - ${data.charityName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; border-bottom: 2px solid #000; padding-bottom: 10px;">
            New Bello Partnership Application
          </h1>
          
          <div style="margin: 20px 0;">
            <h2 style="color: #333; font-size: 18px;">Organization Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 200px;">Charity Name:</td>
                <td style="padding: 8px 0;">${escapeHtml(data.charityName)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Contact Person:</td>
                <td style="padding: 8px 0;">${escapeHtml(data.contactPerson)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Registration Number:</td>
                <td style="padding: 8px 0;">${escapeHtml(data.registrationNumber)}</td>
              </tr>
            </table>
          </div>

          <div style="margin: 20px 0;">
            <h2 style="color: #333; font-size: 18px;">Contact Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 200px;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Telephone:</td>
                <td style="padding: 8px 0;">${escapeHtml(data.telephone)}</td>
              </tr>
              ${data.website ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Website:</td>
                <td style="padding: 8px 0;"><a href="${escapeHtml(data.website)}" target="_blank">${escapeHtml(data.website)}</a></td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Address:</td>
                <td style="padding: 8px 0;">${escapeHtml(fullAddress)}</td>
              </tr>
            </table>
          </div>

          <div style="margin: 20px 0;">
            <h2 style="color: #333; font-size: 18px;">Charity Overview</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">
              ${escapeHtml(data.charityOverview)}
            </div>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>This application was submitted through the BelloNecta Bello Partnership registration form.</p>
            <p>Submitted on: ${escapeHtml(new Date().toLocaleString())}</p>
          </div>
        </div>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send partnership application email");
    }

    console.log("Partnership application email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Application submitted successfully",
        data: emailData
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-partnership-application function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
