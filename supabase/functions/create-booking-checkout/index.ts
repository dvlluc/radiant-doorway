import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("[CREATE-BOOKING-CHECKOUT] Function invoked");
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    console.log("[CREATE-BOOKING-CHECKOUT] User authenticated:", user.email);

    const { coupon } = await req.json().catch(() => ({}));

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    console.log("[CREATE-BOOKING-CHECKOUT] Stripe client initialized");
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[CREATE-BOOKING-CHECKOUT] Existing customer found:", customerId);
      
      // Check for existing active subscriptions for this product
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 100,
      });
      
      const priceId = "price_1SFhVOFVyDwXWupl60nJPfDE";
      
      // Check if user already has an active subscription for this price
      const hasDuplicateSubscription = existingSubscriptions.data.some((sub: Stripe.Subscription) => 
        sub.items.data.some((item: Stripe.SubscriptionItem) => item.price.id === priceId)
      );
      
      if (hasDuplicateSubscription) {
        console.log("[CREATE-BOOKING-CHECKOUT] User already has active subscription");
        throw new Error("You already have an active subscription for this service. Please manage your existing subscription instead.");
      }
    }

    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: "price_1SFhVOFVyDwXWupl60nJPfDE",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/account?tab=settings&payment=success`,
      cancel_url: `${req.headers.get("origin")}/account?tab=settings&payment=cancelled`,
    };

    if (coupon) {
      sessionConfig.discounts = [{ coupon }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-BOOKING-CHECKOUT] Error:", errorMessage);
    console.error("[CREATE-BOOKING-CHECKOUT] Full error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
