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

    // Verify user via anon client + their JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.log('JWT verification failed:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log('Deleting account for user:', userId);

    // Parse optional reason from body
    let reason: string | null = null;
    try {
      const body = await req.json();
      reason = body?.reason || null;
    } catch { /* no body is fine */ }

    // Admin client for elevated operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log the deletion request for audit
    await supabaseAdmin
      .from('account_deletion_requests')
      .insert({
        username: claimsData.claims.email || 'unknown',
        email: claimsData.claims.email || 'unknown',
        reason: reason,
        status: 'completed',
        processed_at: new Date().toISOString(),
      });

    // Delete user data (cascade handles most, but explicit cleanup for safety)
    const tables = [
      { table: 'posts', column: 'user_id' },
      { table: 'likes', column: 'user_id' },
      { table: 'comments', column: 'user_id' },
      { table: 'follows', column: 'follower_id' },
      { table: 'follows', column: 'following_id' },
      { table: 'messages', column: 'sender_id' },
      { table: 'conversation_participants', column: 'user_id' },
      { table: 'dating_profiles', column: 'user_id' },
      { table: 'dating_likes', column: 'from_user_id' },
      { table: 'dating_matches', column: 'user1_id' },
      { table: 'dating_matches', column: 'user2_id' },
      { table: 'confessions', column: 'user_id' },
      { table: 'community_members', column: 'user_id' },
      { table: 'club_memberships', column: 'user_id' },
      { table: 'recent_chats', column: 'user_id' },
      { table: 'device_tokens', column: 'user_id' },
      { table: 'notifications', column: 'user_id' },
      { table: 'user_presence', column: 'user_id' },
      { table: 'blocked_users', column: 'blocker_id' },
      { table: 'blocked_users', column: 'blocked_id' },
    ];

    for (const { table, column } of tables) {
      const { error } = await supabaseAdmin.from(table).delete().eq(column, userId);
      if (error) {
        console.log(`Non-fatal: error deleting from ${table}.${column}:`, error.message);
      }
    }

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.log('Error deleting profile (non-fatal):', profileError.message);
    }

    // Delete the auth user permanently
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError.message);
      throw deleteError;
    }

    console.log('Successfully deleted user:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in delete-account function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
