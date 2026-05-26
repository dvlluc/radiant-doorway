import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReportEmailRequest {
  postId: string;
  reporterId: string;
  reporterEmail: string;
  reason: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, reporterId, reporterEmail, reason }: ReportEmailRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    console.log("Sending report email:", { postId, reporterId, reporterEmail, reason });

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BelloNecta Reports <onboarding@resend.dev>",
        to: ["admin@bellonecta.com"], // Replace with actual admin email
        subject: `Post Report - ${postId}`,
        html: `
          <h1>Post Report Received</h1>
          <p><strong>Post ID:</strong> ${postId}</p>
          <p><strong>Reporter ID:</strong> ${reporterId}</p>
          <p><strong>Reporter Email:</strong> ${reporterEmail}</p>
          <p><strong>Reason:</strong> ${reason || "No reason provided"}</p>
          <p><strong>Report Time:</strong> ${new Date().toISOString()}</p>
          <br>
          <p>Please review this report and take appropriate action.</p>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-report-email function:", error);
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
