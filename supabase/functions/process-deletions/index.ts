import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require CRON_SECRET to prevent unauthorized invocation of this
    // privileged, destructive function. Cron job must send the header.
    const cronSecret = Deno.env.get('CRON_SECRET');
    const provided = req.headers.get('x-cron-secret') ?? '';
    if (!cronSecret || provided.length !== cronSecret.length) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    let diff = 0;
    for (let i = 0; i < cronSecret.length; i++) {
      diff |= cronSecret.charCodeAt(i) ^ provided.charCodeAt(i);
    }
    if (diff !== 0) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find accounts past their 30-day grace period
    const { data: overdueAccounts, error: queryError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, username')
      .not('deletion_scheduled_at', 'is', null)
      .not('deactivated_at', 'is', null)
      .lt('deletion_scheduled_at', new Date().toISOString());

    if (queryError) throw queryError;

    if (!overdueAccounts || overdueAccounts.length === 0) {
      console.log('No overdue accounts to process.');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${overdueAccounts.length} overdue account(s) for permanent deletion.`);

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

    let processed = 0;
    const errors: string[] = [];

    for (const account of overdueAccounts) {
      const userId = account.user_id;
      console.log(`Purging data for user: ${userId}`);

      // Delete from all related tables
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
        console.log('Error deleting profile:', profileError.message);
      }

      // Update deletion request status
      await supabaseAdmin
        .from('account_deletion_requests')
        .update({ status: 'completed', processed_at: new Date().toISOString() })
        .eq('email', account.email || '')
        .eq('status', 'deactivated');

      // Delete auth user permanently
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error(`Error deleting auth user ${userId}:`, deleteError.message);
        errors.push(`${userId}: ${deleteError.message}`);
      } else {
        processed++;
        console.log(`Successfully purged user: ${userId}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, total: overdueAccounts.length, errors }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in process-deletions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process deletions';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
