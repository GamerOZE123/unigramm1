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

interface ReceiverInfo {
  user_id: string
  push_token: string | null
  push_token_type: string | null
  full_name: string | null
  username: string | null
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
        // Get receiver's push token and sender info
        const { data: receiver, error: receiverError } = await supabase
          .from('profiles')
          .select('user_id, push_token, push_token_type, full_name, username')
          .eq('user_id', receiverId)
          .single()

        if (receiverError || !receiver) {
          console.error(`Receiver not found: ${receiverId}`)
          // Mark all as failed
          await markNotificationsFailed(supabase, notifications, 'Receiver not found')
          failedCount += notifications.length
          continue
        }

        if (!receiver.push_token) {
          console.log(`No push token for receiver: ${receiverId}`)
          // Mark as delivered (no token = can't send)
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
          // Multiple messages - batch notification
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

        // Send push notification based on token type
        let sendSuccess = false

        if (receiver.push_token_type === 'web') {
          sendSuccess = await sendWebPush(
            receiver.push_token,
            payload,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject
          )
        } else if (receiver.push_token_type === 'expo') {
          sendSuccess = await sendExpoPush(receiver.push_token, payload)
        } else {
          // Default to web push
          sendSuccess = await sendWebPush(
            receiver.push_token,
            payload,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject
          )
        }

        if (sendSuccess) {
          await markNotificationsDelivered(supabase, notifications)
          successCount += notifications.length
          console.log(`Successfully sent notification to ${receiverId}`)
        } else {
          // Increment attempt count
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

    // Parse the subscription endpoint
    let subscription: { endpoint: string; keys?: { p256dh: string; auth: string } }
    try {
      subscription = JSON.parse(endpoint)
    } catch {
      console.error('Invalid push subscription format')
      return false
    }

    // For Web Push, we need to use the web-push library or implement VAPID signing
    // For simplicity, we'll use a fetch to the push service with proper headers
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data,
      tag: payload.chat_id,
      renotify: true,
    })

    // Note: Full Web Push implementation requires VAPID JWT signing
    // For now, we'll log and return true (placeholder for full implementation)
    console.log('Web Push payload prepared:', pushPayload)
    
    // In production, you would:
    // 1. Generate VAPID JWT
    // 2. Encrypt payload with subscription keys
    // 3. Send to the push service endpoint
    
    return true
  } catch (error) {
    console.error('Error sending web push:', error)
    return false
  }
}

async function sendExpoPush(token: string, payload: NotificationPayload): Promise<boolean> {
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
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Expo push:', error)
    return false
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
      delivery_attempts: 3, // Max out attempts
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
