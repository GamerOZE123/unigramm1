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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const isMainAdmin = adminPassword && password === adminPassword;
    let teamMember: any = null;

    if (!isMainAdmin) {
      // Check if it's a team member password
      const { data: members } = await supabaseAdmin
        .from('admin_team_members')
        .select('*')
        .eq('password', password)
        .eq('is_active', true);
      if (members && members.length > 0) {
        teamMember = members[0];
      }
    }

    if (!isMainAdmin && !teamMember) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const role = isMainAdmin ? 'admin' : 'team';
    const allowedSections = isMainAdmin ? null : (teamMember?.allowed_sections || []);

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

      // Cross-reference with android_testers using signup_email to get Play Store emails
      const { data: androidData } = await supabaseAdmin
        .from('android_testers')
        .select('email, signup_email, status');
      // Map by signup_email (the original early access email) to find the Play Store email
      const androidMap: Record<string, { android_email: string; android_status: string }> = {};
      for (const t of (androidData || [])) {
        const key = (t.signup_email || '').toLowerCase();
        if (key) {
          androidMap[key] = { android_email: t.email, android_status: t.status };
        }
      }

      const enriched = (data || []).map((s: any) => ({
        ...s,
        android_email: androidMap[s.email.toLowerCase()]?.android_email || null,
        android_status: androidMap[s.email.toLowerCase()]?.android_status || null,
      }));

      return json({ valid: true, signups: enriched, role, allowed_sections: allowedSections });
    }

    if (action === 'invite' && id) {
      const { error } = await supabaseAdmin
        .from('early_access_signups')
        .update({ invited: true })
        .eq('id', id);
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, success: true });
    }

    // ── Delete Waitlist Entry ────────────────────────────────
    if (action === 'delete_waitlist_entry' && id) {
      const { error } = await supabaseAdmin
        .from('early_access_signups')
        .delete()
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

    // ── Broadcast Notifications ────────────────────────────────
    if (action === 'fetch_all_user_ids') {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('approved', true);
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, user_ids: (data || []).map((u: any) => u.user_id) });
    }

    if (action === 'broadcast_batch') {
      const { user_ids, title, message, navigate_to, type } = body;
      if (!user_ids?.length || !title || !message) {
        return json({ valid: true, error: 'user_ids, title, and message required' }, 400);
      }

      const rows = user_ids.map((uid: string) => ({
        user_id: uid,
        type: type || 'system',
        title,
        message,
        navigate_to: navigate_to || null,
      }));

      const { error } = await supabaseAdmin.from('notifications').insert(rows);
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, success: true, inserted: user_ids.length });
    }

    // ── Authenticated Users (Auth list) ─────────────────────
    if (action === 'fetch_auth_users') {
      const allUsers: any[] = [];
      let page = 1;
      const perPage = 1000;
      while (true) {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
        if (error) return json({ valid: true, error: error.message }, 400);
        allUsers.push(...users);
        if (users.length < perPage) break;
        page++;
      }

      const authUsers = allUsers.map((u: any) => ({
        id: u.id,
        email: u.email || null,
        phone: u.phone || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
        email_confirmed_at: u.email_confirmed_at || null,
        provider: u.app_metadata?.provider || 'email',
      }));

      return json({ valid: true, auth_users: authUsers });
    }

    if (action === 'force_delete_auth_user') {
      const { user_id } = body;
      if (!user_id) return json({ valid: true, error: 'user_id required' }, 400);

      // Comprehensive table cleanup
      const tables = [
        { table: 'posts', col: 'user_id' },
        { table: 'comments', col: 'user_id' },
        { table: 'likes', col: 'user_id' },
        { table: 'post_views', col: 'user_id' },
        { table: 'post_impressions', col: 'user_id' },
        { table: 'follows', col: 'follower_id' },
        { table: 'follows', col: 'following_id' },
        { table: 'messages', col: 'sender_id' },
        { table: 'conversation_participants', col: 'user_id' },
        { table: 'conversations', col: 'user1_id' },
        { table: 'conversations', col: 'user2_id' },
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
        { table: 'dating_messages', col: 'sender_id' },
        { table: 'community_members', col: 'user_id' },
        { table: 'community_messages', col: 'sender_id' },
        { table: 'club_memberships', col: 'user_id' },
        { table: 'club_join_requests', col: 'student_id' },
        { table: 'club_followers', col: 'user_id' },
        { table: 'chat_group_members', col: 'user_id' },
        { table: 'group_messages', col: 'sender_id' },
        { table: 'recent_chats', col: 'user_id' },
        { table: 'recent_chats', col: 'other_user_id' },
        { table: 'blocked_users', col: 'blocker_id' },
        { table: 'blocked_users', col: 'blocked_id' },
        { table: 'device_tokens', col: 'user_id' },
        { table: 'carpool_rides', col: 'driver_id' },
        { table: 'carpool_ride_requests', col: 'passenger_id' },
        { table: 'business_profiles', col: 'user_id' },
        { table: 'clubs_profiles', col: 'user_id' },
        { table: 'startup_contributors', col: 'user_id' },
        { table: 'startup_likes', col: 'user_id' },
        { table: 'startups', col: 'founder_id' },
        { table: 'marketplace_items', col: 'seller_id' },
        { table: 'student_store_items', col: 'user_id' },
        { table: 'auctions', col: 'user_id' },
        { table: 'auction_bids', col: 'user_id' },
        { table: 'cleared_chats', col: 'user_id' },
        { table: 'deleted_chats', col: 'user_id' },
        { table: 'user_presence', col: 'user_id' },
        { table: 'typing_status', col: 'user_id' },
        { table: 'message_status', col: 'user_id' },
        { table: 'message_notifications', col: 'sender_id' },
        { table: 'message_notifications', col: 'receiver_id' },
        { table: 'notification_batches', col: 'receiver_id' },
        { table: 'notification_batches', col: 'sender_id' },
        { table: 'conversation_pinned_messages', col: 'pinned_by' },
        { table: 'advertising_posts', col: 'company_id' },
        { table: 'advertising_likes', col: 'user_id' },
        { table: 'advertising_clicks', col: 'user_id' },
        { table: 'advertising_post_views', col: 'user_id' },
        { table: 'alumni_verifications', col: 'user_id' },
        { table: 'challenge_participants', col: 'user_id' },
        { table: 'challenge_progress', col: 'user_id' },
        { table: 'workout_sessions', col: 'user_id' },
        { table: 'scheduled_workouts', col: 'user_id' },
        { table: 'fitness_challenges', col: 'created_by' },
        { table: 'job_applications', col: 'student_id' },
        { table: 'job_swipes', col: 'student_id' },
        { table: 'jobs', col: 'company_id' },
        { table: 'student_profiles', col: 'user_id' },
        { table: 'company_profiles', col: 'user_id' },
        { table: 'user_subscriptions', col: 'user_id' },
        { table: 'university_reviews', col: 'user_id' },
        { table: 'courses', col: 'user_id' },
        { table: 'timetables', col: 'user_id' },
        { table: 'account_deletion_requests', col: 'email' },
      ];

      const errors: string[] = [];
      for (const { table, col } of tables) {
        try {
          // Skip email-based lookups for account_deletion_requests
          if (col === 'email') continue;
          await supabaseAdmin.from(table).delete().eq(col, user_id);
        } catch (e: any) {
          errors.push(`${table}.${col}: ${e.message}`);
        }
      }

      // Delete profile
      try {
        await supabaseAdmin.from('profiles').delete().eq('user_id', user_id);
      } catch (_) {}

      // Delete auth user
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (authError) {
        return json({ valid: true, error: `Auth deletion failed: ${authError.message}`, partial_errors: errors }, 400);
      }

      return json({ valid: true, success: true, cleanup_errors: errors });
    }

    // ── Team Member Management (admin only) ─────────────────
    if (action === 'fetch_team_members') {
      if (!isMainAdmin) return json({ valid: true, error: 'Only main admin can manage team' }, 403);
      const { data, error } = await supabaseAdmin
        .from('admin_team_members')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, members: data });
    }

    if (action === 'add_team_member') {
      if (!isMainAdmin) return json({ valid: true, error: 'Only main admin can manage team' }, 403);
      const { name, email: memberEmail, member_password, allowed_sections: sections } = body;
      if (!name || !member_password) return json({ valid: true, error: 'name and member_password required' }, 400);
      const { data, error } = await supabaseAdmin
        .from('admin_team_members')
        .insert({ name, email: memberEmail || null, password: member_password, allowed_sections: sections || [] })
        .select()
        .single();
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, success: true, member: data });
    }

    if (action === 'update_team_member') {
      if (!isMainAdmin) return json({ valid: true, error: 'Only main admin can manage team' }, 403);
      const { member_id, name, email: memberEmail, member_password, allowed_sections: sections, is_active } = body;
      if (!member_id) return json({ valid: true, error: 'member_id required' }, 400);
      const updates: any = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (memberEmail !== undefined) updates.email = memberEmail;
      if (member_password) updates.password = member_password;
      if (sections !== undefined) updates.allowed_sections = sections;
      if (is_active !== undefined) updates.is_active = is_active;
      const { error } = await supabaseAdmin.from('admin_team_members').update(updates).eq('id', member_id);
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, success: true });
    }

    if (action === 'delete_team_member') {
      if (!isMainAdmin) return json({ valid: true, error: 'Only main admin can manage team' }, 403);
      const { member_id } = body;
      if (!member_id) return json({ valid: true, error: 'member_id required' }, 400);
      const { error } = await supabaseAdmin.from('admin_team_members').delete().eq('id', member_id);
      if (error) return json({ valid: true, error: error.message }, 400);
      return json({ valid: true, success: true });
    }

    // Default: just validate password
    return json({ valid: true, role, allowed_sections: allowedSections });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
