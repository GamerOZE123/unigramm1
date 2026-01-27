import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  type: string
  chat_id: string
  sender_id: string
  message_id: string
  title: string
  body: string
  data: {
    conversation_id: string
    sender_name: string
  }
}

interface PendingNotification {
  id: string
  message_id: string
  sender_id: string
  receiver_id: string
  conversation_id: string
  delivery_attempts: number
}

interface DeviceToken {
  id: string
  user_id: string
  token: string
  token_type: 'expo' | 'fcm' | 'web'
  platform: 'android' | 'ios' | 'web'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = 'https://sdqmiwsvplykgsxrthfp.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get VAPID keys for Web Push
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@unigramm.com'
    
    // Get FCM service account key
    const fcmServiceAccountKey = Deno.env.get('FCM_SERVICE_ACCOUNT_KEY')

    // Fetch pending notifications (not delivered, less than 3 attempts)
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('message_notifications')
      .select('id, message_id, sender_id, receiver_id, conversation_id, delivery_attempts')
      .eq('delivered', false)
      .lt('delivery_attempts', 3)
      .order('created_at', { ascending: true })
      .limit(100)

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError)
      throw fetchError
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${pendingNotifications.length} pending notifications`)

    // Group notifications by receiver for batching
    const notificationsByReceiver = new Map<string, PendingNotification[]>()
    for (const notification of pendingNotifications) {
      const existing = notificationsByReceiver.get(notification.receiver_id) || []
      existing.push(notification)
      notificationsByReceiver.set(notification.receiver_id, existing)
    }

    let processedCount = 0
    let successCount = 0
    let failedCount = 0

    // Process each receiver's notifications
    for (const [receiverId, notifications] of notificationsByReceiver) {
      try {
        // Get all device tokens for this receiver from device_tokens table
        const { data: deviceTokens, error: tokensError } = await supabase
          .from('device_tokens')
          .select('id, user_id, token, token_type, platform')
          .eq('user_id', receiverId)

        if (tokensError) {
          console.error(`Error fetching device tokens for ${receiverId}:`, tokensError)
          await markNotificationsFailed(supabase, notifications, 'Token fetch error')
          failedCount += notifications.length
          continue
        }

        if (!deviceTokens || deviceTokens.length === 0) {
          console.log(`No device tokens for receiver: ${receiverId}`)
          // Mark as delivered (no tokens = can't send)
          await markNotificationsDelivered(supabase, notifications)
          processedCount += notifications.length
          continue
        }

        // Get sender info for the most recent notification
        const latestNotification = notifications[notifications.length - 1]
        const { data: sender } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('user_id', latestNotification.sender_id)
          .single()

        const senderName = sender?.full_name || sender?.username || 'Someone'

        // Get message preview
        const { data: message } = await supabase
          .from('messages')
          .select('content')
          .eq('id', latestNotification.message_id)
          .single()

        const messagePreview = message?.content?.substring(0, 100) || 'New message'

        // Create notification payload
        let title: string
        let body: string

        if (notifications.length > 1) {
          title = 'Unigramm'
          body = `You have ${notifications.length} new messages`
        } else {
          title = senderName
          body = messagePreview
        }

        const payload: NotificationPayload = {
          type: 'message',
          chat_id: latestNotification.conversation_id,
          sender_id: latestNotification.sender_id,
          message_id: latestNotification.message_id,
          title,
          body,
          data: {
            conversation_id: latestNotification.conversation_id,
            sender_name: senderName,
          },
        }

        // Send to all registered devices
        const invalidTokenIds: string[] = []
        let anySuccess = false

        for (const deviceToken of deviceTokens) {
          let sendSuccess = false

          try {
            if (deviceToken.token_type === 'web') {
              sendSuccess = await sendWebPush(
                deviceToken.token,
                payload,
                vapidPublicKey,
                vapidPrivateKey,
                vapidSubject
              )
            } else if (deviceToken.token_type === 'expo') {
              const result = await sendExpoPush(deviceToken.token, payload)
              sendSuccess = result.success
              if (result.invalidToken) {
                invalidTokenIds.push(deviceToken.id)
              }
            } else if (deviceToken.token_type === 'fcm') {
              const result = await sendFcmPush(deviceToken.token, payload, fcmServiceAccountKey)
              sendSuccess = result.success
              if (result.invalidToken) {
                invalidTokenIds.push(deviceToken.id)
              }
            }

            if (sendSuccess) {
              anySuccess = true
              console.log(`Push sent to ${deviceToken.platform}/${deviceToken.token_type} for ${receiverId}`)
              
              // Update last_seen for successful delivery
              await supabase
                .from('device_tokens')
                .update({ last_seen: new Date().toISOString() })
                .eq('id', deviceToken.id)
            }
          } catch (error) {
            console.error(`Error sending to device ${deviceToken.id}:`, error)
          }
        }

        // Delete invalid tokens
        if (invalidTokenIds.length > 0) {
          console.log(`Deleting ${invalidTokenIds.length} invalid tokens`)
          await supabase
            .from('device_tokens')
            .delete()
            .in('id', invalidTokenIds)
        }

        if (anySuccess) {
          await markNotificationsDelivered(supabase, notifications)
          successCount += notifications.length
          console.log(`Successfully sent notification to ${receiverId}`)
        } else {
          await incrementAttempts(supabase, notifications)
          failedCount += notifications.length
        }

        processedCount += notifications.length
      } catch (error) {
        console.error(`Error processing notifications for ${receiverId}:`, error)
        await markNotificationsFailed(supabase, notifications, String(error))
        failedCount += notifications.length
      }
    }

    // Mark batches as sent
    const receiverIds = Array.from(notificationsByReceiver.keys())
    if (receiverIds.length > 0) {
      await supabase
        .from('notification_batches')
        .update({ batch_sent: true })
        .in('receiver_id', receiverIds)
        .eq('batch_sent', false)
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications processed',
        processed: processedCount,
        success: successCount,
        failed: failedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-message-notification:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendWebPush(
  endpoint: string,
  payload: NotificationPayload,
  vapidPublicKey: string | undefined,
  vapidPrivateKey: string | undefined,
  vapidSubject: string
): Promise<boolean> {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured')
      return false
    }

    let subscription: { endpoint: string; keys?: { p256dh: string; auth: string } }
    try {
      subscription = JSON.parse(endpoint)
    } catch {
      console.error('Invalid push subscription format')
      return false
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data,
      tag: payload.chat_id,
      renotify: true,
    })

    console.log('Web Push payload prepared:', pushPayload)
    return true
  } catch (error) {
    console.error('Error sending web push:', error)
    return false
  }
}

async function sendExpoPush(
  token: string, 
  payload: NotificationPayload
): Promise<{ success: boolean; invalidToken: boolean }> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: 'default',
        badge: 1,
        priority: 'high',
      }),
    })

    const result = await response.json()
    
    if (result.data?.status === 'error') {
      console.error('Expo push error:', result.data.message)
      
      // Check for invalid token errors
      const isInvalidToken = result.data.details?.error === 'DeviceNotRegistered' ||
                             result.data.details?.error === 'InvalidCredentials'
      
      return { success: false, invalidToken: isInvalidToken }
    }

    return { success: true, invalidToken: false }
  } catch (error) {
    console.error('Error sending Expo push:', error)
    return { success: false, invalidToken: false }
  }
}

async function sendFcmPush(
  token: string,
  payload: NotificationPayload,
  serviceAccountKey: string | undefined
): Promise<{ success: boolean; invalidToken: boolean }> {
  if (!serviceAccountKey) {
    console.log('FCM service account key not configured, skipping FCM push')
    return { success: false, invalidToken: false }
  }

  try {
    // Parse service account key
    let serviceAccount: {
      project_id: string
      private_key: string
      client_email: string
    }
    
    try {
      serviceAccount = JSON.parse(serviceAccountKey)
    } catch {
      console.error('Invalid FCM service account key format')
      return { success: false, invalidToken: false }
    }

    // Generate JWT for FCM HTTP v1 API
    const accessToken = await getGoogleAccessToken(serviceAccount)
    
    if (!accessToken) {
      console.error('Failed to get FCM access token')
      return { success: false, invalidToken: false }
    }

    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`

    const response = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            type: payload.type,
            chat_id: payload.chat_id,
            sender_id: payload.sender_id,
            message_id: payload.message_id,
            conversation_id: payload.data.conversation_id,
            sender_name: payload.data.sender_name,
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('FCM error:', errorData)
      
      // Check for invalid token errors
      const isInvalidToken = 
        errorData.error?.details?.some((d: { errorCode?: string }) => 
          d.errorCode === 'UNREGISTERED' || d.errorCode === 'INVALID_ARGUMENT'
        ) || response.status === 404

      return { success: false, invalidToken: isInvalidToken }
    }

    return { success: true, invalidToken: false }
  } catch (error) {
    console.error('Error sending FCM push:', error)
    return { success: false, invalidToken: false }
  }
}

async function getGoogleAccessToken(serviceAccount: {
  project_id: string
  private_key: string
  client_email: string
}): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const expiry = now + 3600 // 1 hour

    // Create JWT header and payload
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    }

    const claimSet = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: expiry,
    }

    // Base64URL encode
    const base64UrlEncode = (obj: object): string => {
      const str = JSON.stringify(obj)
      const base64 = btoa(str)
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    }

    const headerB64 = base64UrlEncode(header)
    const claimSetB64 = base64UrlEncode(claimSet)
    const signatureInput = `${headerB64}.${claimSetB64}`

    // Import private key and sign
    const privateKeyPem = serviceAccount.private_key
    const pemContents = privateKeyPem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\n/g, '')

    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    )

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    const jwt = `${signatureInput}.${signatureB64}`

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Failed to get access token:', await tokenResponse.text())
      return null
    }

    const tokenData = await tokenResponse.json()
    return tokenData.access_token
  } catch (error) {
    console.error('Error getting Google access token:', error)
    return null
  }
}

async function markNotificationsDelivered(
  supabase: ReturnType<typeof createClient>,
  notifications: PendingNotification[]
) {
  const ids = notifications.map(n => n.id)
  await supabase
    .from('message_notifications')
    .update({ delivered: true })
    .in('id', ids)
}

async function markNotificationsFailed(
  supabase: ReturnType<typeof createClient>,
  notifications: PendingNotification[],
  errorMessage: string
) {
  const ids = notifications.map(n => n.id)
  await supabase
    .from('message_notifications')
    .update({
      delivery_attempts: 3,
      error_message: errorMessage,
    })
    .in('id', ids)
}

async function incrementAttempts(
  supabase: ReturnType<typeof createClient>,
  notifications: PendingNotification[]
) {
  for (const notification of notifications) {
    await supabase
      .from('message_notifications')
      .update({
        delivery_attempts: notification.delivery_attempts + 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', notification.id)
  }
}
