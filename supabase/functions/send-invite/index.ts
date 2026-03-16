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
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">



  


    
      
        



          
          
            
              
                Unigramm
              
            
          

          
          
            

              
              


                Early Access Approved
              



              
              


                You're in! 🎓
              



              
              



              
              


                ${greeting},
              


              


                Your early access to Unigramm has been approved. You're one of the first to join India's campus social network.
              


              


                Download the app and sign up using this exact email address:
              



              
              


                ${email}
              



              
              
                Download on the App Store →
              

              
              



              
              


                
                  
                    

💬


                    

Campus Chat


                    

DMs & groups


                  
                  
                    

🚀


                    

Startups


                    

Find co-founders


                  
                  
                    

🤝


                    

Clubs


                    

Join your campus


                  
                
              



            
          

          
          
            
              


                Welcome aboard — Team Unigramm
              


              


                © 2026 Unigramm ·
                unigramm.com
              


            
          

        


      
    




`

    await transport.sendMail({
      from: smtpUser,
      to: email,
      subject: "You're in — Welcome to Unigramm 🎓",
      text: `${greeting},\n\nYour early access to Unigramm has been approved.\nDownload the app and sign up using this exact email: ${email}\n\nDownload: https://apps.apple.com/us/app/unigramm/id6759472658\n\nWelcome aboard,\nTeam Unigramm`,
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