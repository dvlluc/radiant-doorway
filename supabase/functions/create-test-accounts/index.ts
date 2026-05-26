import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestAccount {
  email: string;
  password: string;
  accountType: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  brandName?: string;
  organizationName?: string;
  registrationNumber?: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const testAccounts: TestAccount[] = [
      // Individual accounts
      {
        email: "individual1@bellonecta.test",
        password: "Test123!@#",
        accountType: "individual",
        firstName: "James",
        lastName: "Wilson",
      },
      {
        email: "individual2@bellonecta.test",
        password: "Test123!@#",
        accountType: "individual",
        firstName: "Sarah",
        lastName: "Johnson",
      },
      {
        email: "individual3@bellonecta.test",
        password: "Test123!@#",
        accountType: "individual",
        firstName: "Michael",
        lastName: "Brown",
      },
      // Business accounts
      {
        email: "business1@bellonecta.test",
        password: "Test123!@#",
        accountType: "business",
        firstName: "David",
        lastName: "Martinez",
        businessName: "Elegant Hair Salon",
        category: "Hair Salon",
      },
      {
        email: "business2@bellonecta.test",
        password: "Test123!@#",
        accountType: "business",
        firstName: "Emma",
        lastName: "Thompson",
        businessName: "Perfect Nails Studio",
        category: "Nail Salon",
      },
      // Brand account
      {
        email: "brand1@bellonecta.test",
        password: "Test123!@#",
        accountType: "brand",
        firstName: "Robert",
        lastName: "Anderson",
        brandName: "Luxe Beauty Products",
      },
      // Charity account
      {
        email: "charity1@bellonecta.test",
        password: "Test123!@#",
        accountType: "charitable_partner",
        firstName: "Lisa",
        lastName: "Garcia",
        organizationName: "Beauty for All Foundation",
        registrationNumber: "CHR12345",
      },
    ];

    const results = [];

    for (const account of testAccounts) {
      console.log(`Creating account: ${account.email}`);

      const metadata: any = {
        account_type: account.accountType,
        first_name: account.firstName,
        last_name: account.lastName,
      };

      if (account.businessName) metadata.business_name = account.businessName;
      if (account.category) metadata.business_category = account.category;
      if (account.brandName) metadata.brand_name = account.brandName;
      if (account.organizationName) metadata.organization_name = account.organizationName;
      if (account.registrationNumber) metadata.registration_number = account.registrationNumber;

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: metadata,
      });

      if (error) {
        console.error(`Error creating ${account.email}:`, error);
        results.push({
          email: account.email,
          success: false,
          error: error.message,
        });
      } else {
        console.log(`Successfully created ${account.email}`);
        results.push({
          email: account.email,
          password: account.password,
          accountType: account.accountType,
          success: true,
          userId: data.user?.id,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in create-test-accounts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
