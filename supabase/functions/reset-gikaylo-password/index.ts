import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Reset password for info@gikaylo.com
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const gikayloUser = users.users.find(u => u.email === 'info@gikaylo.com');
    
    if (!gikayloUser) {
      throw new Error('User info@gikaylo.com not found');
    }

    // Update password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      gikayloUser.id,
      { password: 'password123' }
    );

    if (error) {
      console.error('Error updating password:', error);
      throw error;
    }

    console.log('Password reset successful for info@gikaylo.com');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset to password123 for info@gikaylo.com' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
