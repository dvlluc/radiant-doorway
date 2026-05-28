import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupVerificationRequest {
  email: string;
  confirmLink?: string;
  redirectTo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmLink: fallbackLink, redirectTo }: SignupVerificationRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    let confirmLink = fallbackLink ?? `${redirectTo ?? ""}/auth?type=signup`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email,
        options: { redirectTo: redirectTo ?? `${new URL(req.url).origin}/` },
      });
      if (!linkError && linkData.properties?.action_link) {
        confirmLink = linkData.properties.action_link;
      } else if (linkError) {
        console.warn("generateLink failed, using fallback link:", linkError.message);
      }
    }

    console.log("Sending signup verification email to:", email);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BelloNecta <onboarding@resend.dev>",
        to: [email],
        subject: "Confirm Your Email - BelloNecta",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Confirm Your Email</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">BelloNecta</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px 40px 20px;">
                          <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Confirm Your Email</h2>
                          <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                            Thanks for signing up! Click the button below to verify your email address and complete your registration:
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 40px 30px; text-align: center;">
                          <a href="${confirmLink}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Confirm Email</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 40px 30px;">
                          <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.5;">
                            Or copy and paste this link into your browser:
                          </p>
                          <p style="margin: 0; word-break: break-all;">
                            <a href="${confirmLink}" style="color: #667eea; text-decoration: none; font-size: 14px;">${confirmLink}</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 40px 40px; border-top: 1px solid #eeeeee;">
                          <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.5;">
                            If you didn't create an account, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: #f9f9f9; padding: 30px 40px; text-align: center; border-top: 1px solid #eeeeee;">
                          <p style="margin: 0; color: #999999; font-size: 12px;">
                            © 2025 BelloNecta. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const data = await emailResponse.json();
    console.log("Signup verification email sent successfully:", data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending signup verification email:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
