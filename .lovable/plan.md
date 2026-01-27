
# Push Notification System Enhancement for Mobile

## Current State Analysis

Your project already has a working push notification system:
- `profiles.push_token` / `push_token_type` columns for single web push token
- `message_notifications` queue table with batching support
- `enqueue_message_notification` trigger on message insert
- `send-message-notification` edge function with Expo Push support
- VAPID keys configured for Web Push

## What This Plan Adds

The enhancement creates a **multi-device push notification system** for native mobile apps:

1. **Multiple devices per user** - A user can have the web app + Android + iOS all registered
2. **FCM support** - Native Android/iOS push via Firebase Cloud Messaging
3. **Token lifecycle management** - Auto-cleanup of invalid tokens
4. **Platform awareness** - Different delivery paths for web vs mobile

---

## Technical Implementation

### 1. Database: New device_tokens Table

```sql
CREATE TABLE device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  token_type text NOT NULL CHECK (token_type IN ('expo', 'fcm', 'web')),
  platform text NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_name text,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indexes for efficient lookups
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX idx_device_tokens_token_type ON device_tokens(token_type);

-- RLS policies
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tokens"
  ON device_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON device_tokens FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 2. Edge Function: Enhanced send-message-notification

The existing edge function will be updated to:

```text
+-------------------+     +----------------------+     +------------------+
|  message_         |     |  send-message-       |     |  Push Services   |
|  notifications    | --> |  notification        | --> |  - Expo API      |
|  (queue table)    |     |  (edge function)     |     |  - FCM HTTP v1   |
+-------------------+     +----------------------+     |  - Web Push      |
                                   |                   +------------------+
                                   v
                          +----------------------+
                          |  device_tokens       |
                          |  (lookup all devices)|
                          +----------------------+
```

Key changes:
- Query `device_tokens` table instead of `profiles.push_token`
- Add FCM HTTP v1 API integration (requires FCM service account key)
- Delete invalid tokens automatically (410 Gone responses)
- Send to all registered devices for a user

### 3. Required Secrets

You'll need to add one new secret for FCM:

| Secret Name | Purpose |
|-------------|---------|
| `FCM_SERVICE_ACCOUNT_KEY` | JSON string of Firebase service account for FCM HTTP v1 API |

Note: Existing VAPID keys remain for web push.

### 4. Migration Path

Since the existing system stores tokens in `profiles`, we'll:
1. Create the new `device_tokens` table
2. Migrate existing web tokens from `profiles` to `device_tokens`
3. Update the edge function to read from `device_tokens`
4. Keep `profiles.push_token` columns for backward compatibility (deprecated)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/xxx_device_tokens.sql` | Create | New table, indexes, RLS, data migration |
| `supabase/functions/send-message-notification/index.ts` | Modify | Add FCM support, multi-device delivery |
| `supabase/config.toml` | No change | Function config already correct |

---

## Security Considerations

1. **FCM key protection**: The `FCM_SERVICE_ACCOUNT_KEY` is stored as a Supabase secret, never exposed to clients
2. **RLS on device_tokens**: Users can only manage their own tokens
3. **Token validation**: Invalid tokens are auto-deleted to prevent data leaks
4. **Edge function auth**: `verify_jwt = false` allows cron/webhook triggers, but function uses service role key internally

---

## Deployment Steps

1. Add `FCM_SERVICE_ACCOUNT_KEY` secret (you'll need to provide the Firebase service account JSON)
2. Run database migration to create `device_tokens` table
3. Deploy updated edge function
4. Update mobile app to call token registration endpoint

---

## Mobile App Integration

The mobile app will need to:

```typescript
// Register device token
const { error } = await supabase
  .from('device_tokens')
  .upsert({
    user_id: user.id,
    token: expoPushToken,
    token_type: 'expo', // or 'fcm'
    platform: Platform.OS, // 'android' or 'ios'
  }, { 
    onConflict: 'token' 
  });
```

---

## Before Proceeding

Do you have a Firebase project set up for FCM? If so, you'll need to:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate a new private key (JSON file)
3. Provide it as the `FCM_SERVICE_ACCOUNT_KEY` secret

If you're using Expo Push only (no native FCM), we can skip the FCM integration and just add multi-device support with Expo.
