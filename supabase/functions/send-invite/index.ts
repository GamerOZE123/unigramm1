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

    const greeting = name ? `Hi ${name}` : 'Hi there'

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 16px; color: #1a1a1a;">
  <h1 style="font-size: 22px; margin-bottom: 16px;">You're in! 🎓</h1>
  <p style="font-size: 15px; line-height: 1.6;">${greeting},</p>
  <p style="font-size: 15px; line-height: 1.6;">
    Your early access to <strong>Unigramm</strong> has been approved! You're one of the first to join India's campus social network.
  </p>
  <p style="font-size: 15px; line-height: 1.6;">
    Download the app and sign up using this exact email address:<br/>
    <strong>${email}</strong>
  </p>
  <p style="font-size: 15px; line-height: 1.6; margin-top: 24px;">
    <a href="https://unigramm.com" style="background: #000; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block;">
      Get Started →
    </a>
  </p>
  <p style="font-size: 13px; color: #888; margin-top: 32px;">
    Welcome aboard,<br/>Team Unigramm
  </p>
</body>
</html>`

    await transport.sendMail({
      from: smtpUser,
      to: email,
      subject: "You're in — Welcome to Unigramm 🎓",
      text: `${greeting},\n\nYour early access to Unigramm has been approved. Download the app and sign up using this exact email address: ${email}\n\nGet started: https://unigramm.com`,
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
