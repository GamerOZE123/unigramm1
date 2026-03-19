import nodemailer from 'npm:nodemailer@6.9.16'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
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

    const PLAYSTORE_TESTER_LINK = 'PLAYSTORE_TESTER_LINK'

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#080c17;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080c17;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

<!-- Logo -->
<tr><td align="center" style="padding-bottom:32px;">
  <span style="font-size:22px;font-weight:700;color:#4f8eff;letter-spacing:-0.5px;">Unigramm</span>
</td></tr>

<!-- Card -->
<tr><td style="background:linear-gradient(145deg,rgba(79,142,255,0.08),rgba(141,207,255,0.04));border:1px solid rgba(79,142,255,0.15);border-radius:16px;padding:36px 28px;">

  <!-- Badge -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:20px;">
    <span style="display:inline-block;background:rgba(79,142,255,0.15);color:#8dcfff;font-size:11px;font-weight:600;padding:6px 14px;border-radius:20px;letter-spacing:0.5px;">ANDROID BETA ACCESS</span>
  </td></tr></table>

  <!-- Headline -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:16px;">
    <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Download Unigramm on Android 🤖</h1>
  </td></tr></table>

  <!-- Body -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:28px;">
    <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;">
      You've been added to our Android beta. Tap the button below to become a tester and install the app.
    </p>
  </td></tr></table>

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">
    <a href="${PLAYSTORE_TESTER_LINK}" style="display:inline-block;background:linear-gradient(135deg,#4f8eff,#8dcfff);color:#080c17;font-size:14px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">
      Download from Play Store →
    </a>
  </td></tr></table>

  <!-- Note -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6;">
      Make sure you're signed into Gmail on your Android phone before tapping the link.
    </p>
  </td></tr></table>

  <!-- Features row -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid rgba(79,142,255,0.1);padding-top:24px;">
  <tr>
    <td align="center" width="33%" style="padding:0 4px;">
      <div style="font-size:22px;margin-bottom:6px;">💬</div>
      <div style="font-size:12px;font-weight:600;color:#ffffff;">Campus Chat</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);">DMs & groups</div>
    </td>
    <td align="center" width="33%" style="padding:0 4px;">
      <div style="font-size:22px;margin-bottom:6px;">🚀</div>
      <div style="font-size:12px;font-weight:600;color:#ffffff;">Startups</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);">Find co-founders</div>
    </td>
    <td align="center" width="33%" style="padding:0 4px;">
      <div style="font-size:22px;margin-bottom:6px;">🤝</div>
      <div style="font-size:12px;font-weight:600;color:#ffffff;">Clubs</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);">Join your campus</div>
    </td>
  </tr>
  </table>

</td></tr>

<!-- Footer -->
<tr><td align="center" style="padding-top:28px;">
  <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.35);">Welcome aboard — Team Unigramm</p>
  <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.2);">
    © 2026 Unigramm · <a href="https://unigramm.com" style="color:rgba(255,255,255,0.2);text-decoration:none;">unigramm.com</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

    await transport.sendMail({
      from: smtpUser,
      to: email,
      subject: "Your Unigramm Android download link is here 🤖",
      text: `You've been added to our Android beta!\n\nTap the link to become a tester and install the app:\n${PLAYSTORE_TESTER_LINK}\n\nMake sure you're signed into Gmail on your Android phone before tapping the link.\n\nWelcome aboard,\nTeam Unigramm`,
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
