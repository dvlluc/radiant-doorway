import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation function
const validateMessages = (messages: any): { valid: boolean; error?: string } => {
  if (!Array.isArray(messages)) {
    return { valid: false, error: "Messages must be an array" };
  }
  if (messages.length === 0 || messages.length > 50) {
    return { valid: false, error: "Messages array must contain 1-50 messages" };
  }
  for (const msg of messages) {
    if (!msg.role || typeof msg.role !== 'string' || msg.role.length > 50) {
      return { valid: false, error: "Each message must have a valid role (max 50 chars)" };
    }
    if (!msg.content || typeof msg.content !== 'string' || msg.content.length > 10000) {
      return { valid: false, error: "Each message must have content (max 10000 chars)" };
    }
  }
  return { valid: true };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    // Validate messages
    const validation = validateMessages(messages);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a helpful customer support assistant for BelloNecta, a beauty and wellness platform that connects beauty professionals with clients.

Your role is to:
- Answer questions about the platform features and services
- Help users understand how to book appointments
- Explain how professionals can join and grow their business
- Provide information about our marketplace, jobs, events, and community features
- Direct users to the appropriate pages when needed
- Be friendly, professional, and concise

Key features of BelloNecta:
- Directory: Browse and discover beauty professionals
- Booking: Book appointments with beauty professionals
- Marketplace: Shop for beauty products and services
- Jobs: Find career opportunities in the beauty industry
- Events: Discover and attend beauty industry events
- Community: Connect with other beauty professionals and enthusiasts
- Virtual Try-On: Try beauty products virtually before purchasing

Always be helpful and guide users to the right resources.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
