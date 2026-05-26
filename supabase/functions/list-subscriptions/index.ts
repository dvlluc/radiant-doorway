import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LIST-SUBSCRIPTIONS] ${step}${detailsStr}`);
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
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning empty subscriptions");
      return new Response(JSON.stringify({ subscriptions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Fetch all subscriptions (not just active ones)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
      expand: ['data.default_payment_method'],
    });
    logStep("Subscriptions fetched", { count: subscriptions.data.length });

    // Format subscription data
    const formattedSubscriptions = await Promise.all(
      subscriptions.data.map(async (sub: Stripe.Subscription) => {
        try {
          // Log raw subscription data from Stripe
          logStep("Raw Stripe subscription data", {
            id: sub.id,
            status: sub.status,
            current_period_start: sub.current_period_start,
            current_period_end: sub.current_period_end,
            start_date: sub.start_date,
            created: sub.created,
            cancel_at_period_end: sub.cancel_at_period_end,
            has_current_period_start: sub.current_period_start !== undefined && sub.current_period_start !== null,
            has_current_period_end: sub.current_period_end !== undefined && sub.current_period_end !== null
          });

          // Get price details
          const priceId = sub.items.data[0]?.price.id;
          let productName = "Subscription";
          
          if (priceId) {
            try {
              const price = await stripe.prices.retrieve(priceId, {
                expand: ['product'],
              });
              const product = price.product as Stripe.Product;
              productName = product.name;
            } catch (e) {
              logStep("Error fetching product name", { error: e });
            }
          }

          // Safely handle timestamps with proper fallbacks
          let currentPeriodStart: string;
          let currentPeriodEnd: string;
          
          if (sub.current_period_start && sub.current_period_end) {
            // Use actual billing period if available
            currentPeriodStart = new Date(sub.current_period_start * 1000).toISOString();
            currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
          } else {
            // Fallback: calculate from start_date and interval
            const startDate = new Date((sub.start_date || sub.created) * 1000);
            currentPeriodStart = startDate.toISOString();
            
            // Calculate period end based on interval
            const interval = sub.items.data[0]?.price.recurring?.interval || 'month';
            const endDate = new Date(startDate);
            
            switch (interval) {
              case 'day':
                endDate.setDate(endDate.getDate() + 1);
                break;
              case 'week':
                endDate.setDate(endDate.getDate() + 7);
                break;
              case 'month':
                endDate.setMonth(endDate.getMonth() + 1);
                break;
              case 'year':
                endDate.setFullYear(endDate.getFullYear() + 1);
                break;
            }
            
            currentPeriodEnd = endDate.toISOString();
          }
          
          const created = sub.created 
            ? new Date(sub.created * 1000).toISOString() 
            : new Date().toISOString();

          const formattedSub = {
            id: sub.id,
            status: sub.status,
            productName,
            amount: sub.items.data[0]?.price.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0,
            currency: sub.items.data[0]?.price.currency?.toUpperCase() || "USD",
            interval: sub.items.data[0]?.price.recurring?.interval || "month",
            currentPeriodStart,
            currentPeriodEnd,
            created,
            cancelAtPeriodEnd: sub.cancel_at_period_end || false,
          };

          logStep("Formatted subscription", formattedSub);
          return formattedSub;
        } catch (error) {
          logStep("Error formatting subscription", { subscriptionId: sub.id, error });
          // Return a minimal valid object if there's an error
          return {
            id: sub.id,
            status: sub.status,
            productName: "Subscription",
            amount: 0,
            currency: "USD",
            interval: "month",
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date().toISOString(),
            created: new Date().toISOString(),
            cancelAtPeriodEnd: false,
          };
        }
      })
    );

    return new Response(JSON.stringify({ subscriptions: formattedSubscriptions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in list-subscriptions", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});