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
      return json({ valid: true, users: data });
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

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('user_id', user_id);
      if (profileError) return json({ valid: true, error: profileError.message }, 400);

      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (authError) return json({ valid: true, error: authError.message }, 400);

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
