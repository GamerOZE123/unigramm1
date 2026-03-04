import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    let reason: string | null = null;
    let action: string = 'deactivate';
    try {
      const body = await req.json();
      reason = body?.reason || null;
      action = body?.action || 'deactivate';
    } catch { /* no body is fine */ }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Cancel deletion
    if (action === 'cancel') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ deactivated_at: null, deletion_scheduled_at: null })
        .eq('user_id', userId);

      if (error) throw error;

      console.log('Deletion cancelled for user:', userId);
      return new Response(
        JSON.stringify({ success: true, message: 'Account reactivated successfully.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deactivate (30-day grace period)
    const now = new Date();
    const deletionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        deactivated_at: now.toISOString(),
        deletion_scheduled_at: deletionDate.toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Log the request
    await supabaseAdmin
      .from('account_deletion_requests')
      .insert({
        username: claimsData.claims.email || 'unknown',
        email: claimsData.claims.email || 'unknown',
        reason: reason,
        status: 'deactivated',
      });

    console.log('Account deactivated for user:', userId, '— scheduled deletion:', deletionDate.toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deactivated. Permanent deletion in 30 days unless you log back in.',
        deletion_scheduled_at: deletionDate.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in delete-account function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
