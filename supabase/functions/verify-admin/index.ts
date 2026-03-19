import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    // Handle multipart upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const password = formData.get('password') as string;
      const filePath = formData.get('path') as string;
      const file = formData.get('file') as File;
      const adminPassword = Deno.env.get('ADMIN_PASSWORD');

      if (!adminPassword || password !== adminPassword) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { error: uploadError } = await supabaseAdmin.storage
        .from('posts')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        return new Response(JSON.stringify({ valid: true, error: uploadError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: urlData } = supabaseAdmin.storage.from('posts').getPublicUrl(filePath);
      return new Response(JSON.stringify({ valid: true, url: urlData.publicUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { password, action, id } = body;
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');

    if (!adminPassword || password !== adminPassword) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    // ── Waitlist ──────────────────────────────────────────────
    if (action === 'fetch') {
      const { data, error } = await supabaseAdmin
        .from('early_access_signups')
        .select('id, full_name, email, university, created_at, invited')
        .order('created_at', { ascending: false });
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, signups: data });
    }

    if (action === 'invite' && id) {
      const { error } = await supabaseAdmin
        .from('early_access_signups')
        .update({ invited: true })
        .eq('id', id);
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, success: true });
    }

    // ── Feature Flags ────────────────────────────────────────
    if (action === 'fetch_flags') {
      const { data, error } = await supabaseAdmin
        .from('feature_flags')
        .select('*')
        .order('key');
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, flags: data });
    }

    if (action === 'toggle_flag') {
      const { key, is_enabled } = body;
      const { error } = await supabaseAdmin
        .from('feature_flags')
        .update({ is_enabled })
        .eq('key', key);
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, success: true });
    }

    // ── App Config ───────────────────────────────────────────
    if (action === 'fetch_configs') {
      const { data, error } = await supabaseAdmin
        .from('app_config')
        .select('*')
        .order('key');
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, configs: data });
    }

    if (action === 'update_config') {
      const { key, value } = body;
      const { error } = await supabaseAdmin
        .from('app_config')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, success: true });
    }

    // ── User Management ──────────────────────────────────────
    if (action === 'fetch_users') {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('user_id, username, full_name, email, university, user_type, approved, created_at')
        .order('created_at', { ascending: false });
      if (error) return json({ valid: true, error: error.message }, 400);

      // Enrich with email confirmation status from auth
      const enrichedUsers = [];
      for (const user of (data || [])) {
        let email_confirmed = false;
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.user_id);
          email_confirmed = !!authUser?.user?.email_confirmed_at;
        } catch (_) {}
        enrichedUsers.push({ ...user, email_confirmed });
      }
      return json({ valid: true, users: enrichedUsers });
    }

    if (action === 'set_approved') {
      const { user_id, approved } = body;
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ approved })
        .eq('user_id', user_id);
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, success: true });
    }

    // ── Pending Accounts (business/clubs) ────────────────────
    if (action === 'fetch_pending_accounts') {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('user_id, username, full_name, email, university, user_type, approved, created_at')
        .in('user_type', ['business', 'clubs'])
        .or('approved.eq.false,approved.is.null')
        .order('created_at', { ascending: false });
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, accounts: data });
    }

    // ── Delete User Permanently ──────────────────────────────
    if (action === 'delete_user') {
      const { user_id } = body;
      if (!user_id) return json({ valid: true, error: 'user_id required' }, 400);

      // Force-clean related tables (ignore errors for tables that may not have data)
      const relatedTables = [
        { table: 'posts', col: 'user_id' },
        { table: 'comments', col: 'user_id' },
        { table: 'likes', col: 'user_id' },
        { table: 'post_views', col: 'user_id' },
        { table: 'post_impressions', col: 'user_id' },
        { table: 'followers', col: 'follower_id' },
        { table: 'followers', col: 'following_id' },
        { table: 'messages', col: 'sender_id' },
        { table: 'conversation_participants', col: 'user_id' },
        { table: 'notifications', col: 'user_id' },
        { table: 'confessions', col: 'user_id' },
        { table: 'confession_comments', col: 'user_id' },
        { table: 'confession_reactions', col: 'user_id' },
        { table: 'anonymous_messages', col: 'user_id' },
        { table: 'anonymous_message_reactions', col: 'user_id' },
        { table: 'dating_profiles', col: 'user_id' },
        { table: 'dating_likes', col: 'from_user_id' },
        { table: 'dating_likes', col: 'to_user_id' },
        { table: 'dating_passes', col: 'from_user_id' },
        { table: 'dating_passes', col: 'to_user_id' },
        { table: 'dating_matches', col: 'user1_id' },
        { table: 'dating_matches', col: 'user2_id' },
        { table: 'community_members', col: 'user_id' },
        { table: 'community_messages', col: 'sender_id' },
        { table: 'club_memberships', col: 'user_id' },
        { table: 'club_join_requests', col: 'student_id' },
        { table: 'club_followers', col: 'user_id' },
        { table: 'chat_group_members', col: 'user_id' },
        { table: 'recent_chats', col: 'user_id' },
        { table: 'recent_chats', col: 'other_user_id' },
        { table: 'blocked_users', col: 'blocker_id' },
        { table: 'blocked_users', col: 'blocked_id' },
        { table: 'device_tokens', col: 'user_id' },
        { table: 'carpool_rides', col: 'driver_id' },
        { table: 'account_deletion_requests', col: 'username' }, // skip, no user_id col
        { table: 'business_profiles', col: 'user_id' },
        { table: 'clubs_profiles', col: 'user_id' },
        { table: 'startup_contributors', col: 'user_id' },
        { table: 'startup_likes', col: 'user_id' },
        { table: 'marketplace_items', col: 'seller_id' },
        { table: 'student_store_items', col: 'user_id' },
        { table: 'auctions', col: 'user_id' },
        { table: 'cleared_chats', col: 'user_id' },
        { table: 'deleted_chats', col: 'user_id' },
      ];

      for (const { table, col } of relatedTables) {
        try {
          await supabaseAdmin.from(table).delete().eq(col, user_id);
        } catch (_) {
          // ignore — table may not exist or no matching rows
        }
      }

      // Delete profile
      try {
        await supabaseAdmin.from('profiles').delete().eq('user_id', user_id);
      } catch (_) {
        // ignore
      }

      // Delete auth user (force)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (authError) {
        console.error('Auth delete error:', authError.message);
        // Still return success if profile was cleaned
      }

      return json({ valid: true, success: true });
    }

    // ── Confirm User Email ───────────────────────────────────
    if (action === 'confirm_email') {
      const { user_id } = body;
      if (!user_id) return json({ valid: true, error: 'user_id required' }, 400);

      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        email_confirm: true,
      });
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, success: true });
    }

    // Default: just validate password
    return json({ valid: true });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
