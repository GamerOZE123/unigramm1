import nodemailer from 'npm:nodemailer@6.9.16'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(ab.length, bb.length);
  const pa = new Uint8Array(len);
  const pb = new Uint8Array(len);
  pa.set(ab);
  pb.set(bb);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= pa[i] ^ pb[i];
  return diff === 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, admin_password } = await req.json()

    // Require admin authentication to prevent unauthenticated SMTP abuse.
    const adminPassword = Deno.env.get('ADMIN_PASSWORD')
    let authorized = !!(adminPassword && typeof admin_password === 'string' && timingSafeEqual(admin_password, adminPassword))

    if (!authorized && typeof admin_password === 'string' && admin_password.length > 0) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      const { data: members } = await supabaseAdmin.rpc('verify_admin_team_password', { _password: admin_password })
      if (members && members.length > 0) authorized = true
    }

    if (!authorized) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 254) {
      return new Response(
        JSON.stringify({ error: 'A valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPass = Deno.env.get('SMTP_PASS')

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error('SMTP credentials are not configured')
    }

    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort !== 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const PLAYSTORE_TESTER_LINK = 'https://play.google.com/store/apps/details?id=com.nike11.UnigrammApp'
    const LOGO_URL = 'https://unigramm1.lovable.app/unigramm-logo.png'

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#080c17;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080c17;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

<!-- Logo -->
<tr>
  <td align="center" style="padding-bottom:28px;">
    <img src="${LOGO_URL}" alt="Unigramm" height="40" style="display:block;height:40px;width:auto;" />
  </td>
</tr>

<!-- Card -->
<tr>
  <td style="background:rgba(255,255,255,0.06);border-radius:16px;padding:40px 32px;border:1px solid rgba(79,142,255,0.15);background-image:radial-gradient(ellipse 80% 50% at 50% 0%, rgba(79,142,255,0.12) 0%, transparent 70%);">

    <!-- Badge -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:20px;">
        <span style="display:inline-block;background:rgba(79,142,255,0.15);color:#8dcfff;font-size:11px;font-weight:700;padding:6px 16px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;">Android Beta Access</span>
      </td></tr>
    </table>

    <!-- Headline -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:16px;">
        <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;">Download & Sign Up 🤖</h1>
      </td></tr>
    </table>

    <!-- Divider -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom:24px;">
        <div style="height:1px;background:rgba(255,255,255,0.1);"></div>
      </td></tr>
    </table>

    <!-- Body -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:12px;">
        <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;">You've been added to the Android beta</p>
        <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6;">Tap the button below to install Unigramm from the Play Store.</p>
        <p style="margin:12px 0 0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.6;">Make sure you're signed in with this email on Google Play:</p>
        <div style="margin-top:12px;display:inline-block;background:rgba(79,142,255,0.1);border:1px solid rgba(79,142,255,0.25);border-radius:10px;padding:10px 20px;">
          <span style="font-size:14px;font-weight:600;color:#8dcfff;">${email}</span>
        </div>
      </td></tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:24px 0 16px;">
        <a href="${PLAYSTORE_TESTER_LINK}" style="display:inline-block;background:linear-gradient(135deg,#4f8eff 0%,#8dcfff 100%);color:#080c17;font-size:14px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">Download from Play Store →</a>
      </td></tr>
    </table>

  </td>
</tr>

<!-- Footer -->
<tr>
  <td align="center" style="padding-top:28px;">
    <p style="margin:0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.4);">Welcome aboard — Team Unigramm</p>
    <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.2);">
      <a href="https://unigramm.com" style="color:rgba(255,255,255,0.35);text-decoration:none;">unigramm.com</a>
       · 
      © 2026 Unigramm
    </p>
  </td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`

    await transport.sendMail({
      from: smtpUser,
      to: email,
      subject: "Your Unigramm Android download link is here 🤖",
      text: `You've been added to our Android beta!\n\nTap the link to become a tester and install the app:\n${PLAYSTORE_TESTER_LINK}\n\nMake sure you're signed into Google Play with the same email before tapping the link.\n\nWelcome aboard,\nTeam Unigramm`,
      html: htmlBody,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Send android invite error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to send invite' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
