

# Chat System Database Optimization Plan

## Overview
This migration adds optimized RPC functions for chat, performance indexes, and an enhanced notification trigger while maintaining full backward compatibility with existing code.

---

## 1. New RPC: `get_user_conversations_v2`

**Purpose**: Replace the current `get_user_conversations` with a more efficient version that:
- Returns only conversations for the authenticated user (uses `auth.uid()`)
- Joins participant profile data directly (no separate user fetch needed)
- Filters out deleted conversations inline
- Calculates unread count from `message_status` table

**Returns:**
| Column | Type | Description |
|--------|------|-------------|
| conversation_id | uuid | The conversation ID |
| participant_id | uuid | Other user's ID |
| participant_name | text | Other user's display name |
| participant_avatar | text | Other user's avatar URL |
| last_message | text | Most recent message content |
| last_message_at | timestamptz | When last message was sent |
| unread_count | int | Number of unread messages |

**SQL:**
```text
CREATE OR REPLACE FUNCTION public.get_user_conversations_v2()
RETURNS TABLE (
  conversation_id uuid,
  participant_id uuid,
  participant_name text,
  participant_avatar text,
  last_message text,
  last_message_at timestamptz,
  unread_count int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id AS conversation_id,
    CASE 
      WHEN c.user1_id = auth.uid() THEN c.user2_id 
      ELSE c.user1_id 
    END AS participant_id,
    p.full_name AS participant_name,
    p.avatar_url AS participant_avatar,
    m.content AS last_message,
    m.created_at AS last_message_at,
    COALESCE(
      (SELECT COUNT(*)::int 
       FROM messages msg
       JOIN message_status ms ON ms.message_id = msg.id
       WHERE msg.conversation_id = c.id 
         AND msg.sender_id != auth.uid()
         AND ms.user_id = auth.uid()
         AND ms.status != 'read'),
      0
    ) AS unread_count
  FROM conversations c
  JOIN profiles p ON p.user_id = (
    CASE 
      WHEN c.user1_id = auth.uid() THEN c.user2_id 
      ELSE c.user1_id 
    END
  )
  LEFT JOIN messages m ON m.id = c.last_message_id
  WHERE (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM deleted_chats dc 
      WHERE dc.conversation_id = c.id 
        AND dc.user_id = auth.uid()
    )
  ORDER BY COALESCE(c.last_activity, c.created_at) DESC;
$$;
```

---

## 2. New RPC: `sync_messages`

**Purpose**: Fetch messages since a specific timestamp for efficient syncing (pull-based refresh, resume after disconnect).

**Parameters:**
- `convo_id` (uuid) - The conversation to sync
- `since_ts` (timestamptz) - Fetch messages created after this time

**Returns**: All message columns where `created_at > since_ts`, ordered ascending.

**SQL:**
```text
CREATE OR REPLACE FUNCTION public.sync_messages(
  convo_id uuid,
  since_ts timestamptz
)
RETURNS SETOF messages
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM messages
  WHERE conversation_id = convo_id
    AND created_at > since_ts
    AND (
      -- Ensure caller is a participant
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = convo_id
          AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      )
    )
  ORDER BY created_at ASC;
$$;
```

---

## 3. Performance Indexes

**Analysis of existing indexes:**
- `idx_messages_conversation_created` already exists
- Conversation user indexes are MISSING

**Indexes to add:**
```text
-- Optimize conversation lookup by user
CREATE INDEX IF NOT EXISTS idx_conversations_user1
  ON conversations (user1_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user2
  ON conversations (user2_id);

-- Composite index for unread count queries
CREATE INDEX IF NOT EXISTS idx_message_status_user_status
  ON message_status (user_id, status)
  WHERE status != 'read';
```

---

## 4. Message Status Enhancement

**Current state:**
- `message_status` table has: `id`, `message_id`, `user_id`, `status`, `timestamp`, `created_at`
- Status values: `'sent'`, `'delivered'`, `'read'`

**Additions needed:**
```text
-- Add separate timestamp columns for delivery/read tracking
ALTER TABLE message_status 
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;
```

---

## 5. Enhanced Notifications Trigger

**Current triggers on messages:**
- `update_conversation_activity_trigger` - Updates `last_activity` and `last_message_id`
- `create_message_status_trigger` - Creates message_status entries
- `update_recent_chats_trigger` - Updates recent_chats table

**New trigger to add**: Increment unread count for receiver

```text
CREATE OR REPLACE FUNCTION public.increment_unread_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receiver_id uuid;
BEGIN
  -- Determine receiver
  SELECT 
    CASE 
      WHEN c.user1_id = NEW.sender_id THEN c.user2_id 
      ELSE c.user1_id 
    END INTO v_receiver_id
  FROM conversations c 
  WHERE c.id = NEW.conversation_id;

  -- Increment appropriate unread counter
  IF v_receiver_id IS NOT NULL THEN
    UPDATE conversations
    SET 
      unread_count_user1 = CASE 
        WHEN user1_id = v_receiver_id 
        THEN COALESCE(unread_count_user1, 0) + 1 
        ELSE unread_count_user1 
      END,
      unread_count_user2 = CASE 
        WHEN user2_id = v_receiver_id 
        THEN COALESCE(unread_count_user2, 0) + 1 
        ELSE unread_count_user2 
      END
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER increment_unread_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_on_message();
```

---

## Summary of Changes

| Change | Type | Impact |
|--------|------|--------|
| `get_user_conversations_v2` | New RPC | More efficient conversation loading |
| `sync_messages` | New RPC | Efficient message syncing |
| `idx_conversations_user1` | New Index | Faster user conversation queries |
| `idx_conversations_user2` | New Index | Faster user conversation queries |
| `idx_message_status_user_status` | New Index | Faster unread count queries |
| `delivered_at`, `read_at` columns | Schema addition | Detailed delivery tracking |
| `increment_unread_trigger` | New Trigger | Auto-increment unread counts |

---

## Backward Compatibility

- Existing `get_user_conversations` RPC remains unchanged
- No column renames or deletions
- All new columns are nullable with no breaking defaults
- Frontend can migrate to v2 RPC at its own pace

---

## Technical Notes

- All new functions use `auth.uid()` instead of requiring `target_user_id` parameter (more secure)
- Indexes use partial index syntax where beneficial for query optimization
- Trigger fires AFTER INSERT to not block message sending

