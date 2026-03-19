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
    const { email, name } = await req.json()

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

    const greeting = name ? `Hi ${name},` : 'Hi there,'

    const LOGO_URL = 'https://sdqmiwsvplykgsxrthfp.supabase.co/storage/v1/object/public/assets/unigramm-logo.png'

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>You're in — Welcome to Unigramm</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <img src="${LOGO_URL}" alt="Unigramm" height="40" style="display:block;height:40px;width:auto;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

              <!-- Badge -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <span style="display:inline-block;background:#e8f0fe;color:#4f8eff;font-size:11px;font-weight:700;padding:6px 16px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;">Early Access Approved</span>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#1a1a2e;line-height:1.3;">You're in 🎓</h1>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#1a1a2e;">${greeting}</p>
                    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">Your early access to Unigramm has been approved. Welcome to your campus social network.</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="height:1px;background:#e8e8e8;"></div>
                  </td>
                </tr>
              </table>

              <!-- Step -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">Step 1 — Download the app</p>
                    <p style="margin:8px 0 0;font-size:13px;color:#555;line-height:1.6;">Sign up inside the app using this exact email address:</p>
                    <div style="margin-top:12px;display:inline-block;background:#f5f7fa;border:1px solid #e0e4ea;border-radius:10px;padding:10px 20px;">
                      <span style="font-size:14px;font-weight:600;color:#4f8eff;">${email}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:24px 0 16px;">
                    <a href="https://apps.apple.com/us/app/unigramm/id6759472658" style="display:inline-block;background:#4f8eff;color:#ffffff;font-size:14px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">Download on the App Store →</a>
                    <p style="margin:16px 0 0;font-size:13px;color:#888;">On Android?</p>
                    <a href="https://unigramm.com/android-beta" style="font-size:13px;color:#4f8eff;font-weight:600;text-decoration:none;">Get Early Access on Android →</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:13px;font-weight:600;color:#2e3f5c;">Welcome aboard — Team Unigramm</p>
              <p style="margin:8px 0 0;font-size:11px;color:#8c95a6;">
                <a href="https://unigramm.com" style="color:#2e3f5c;text-decoration:none;">unigramm.com</a>
                 · 
                <a href="mailto:manage@unigramm.com" style="color:#2e3f5c;text-decoration:none;">manage@unigramm.com</a>
                 · 
                © 2026 Unigramm
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    await transport.sendMail({
      from: smtpUser,
      to: email,
      subject: "You're in — Welcome to Unigramm 🎓",
      text: `${greeting}\n\nYour early access to Unigramm has been approved. Welcome to your campus social network.\n\nDownload the app and sign up using this exact email address:\n${email}\n\nDownload on the App Store:\nhttps://apps.apple.com/us/app/unigramm/id6759472658\n\nOn Android? Get early access here:\nhttps://unigramm.com/android-beta\n\nWelcome aboard,\nTeam Unigramm\n\nunigramm.com`,
      html: htmlBody,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Send invite error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to send invite' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
