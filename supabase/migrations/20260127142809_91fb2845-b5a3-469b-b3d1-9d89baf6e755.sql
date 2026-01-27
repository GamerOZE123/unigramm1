-- =============================================================
-- Chat System Database Optimization Migration
-- =============================================================

-- 1. New RPC: get_user_conversations_v2
-- More efficient conversation loading with inline profile joins
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

-- 2. New RPC: sync_messages
-- Efficient message syncing for pull-based refresh
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
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = convo_id
          AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      )
    )
  ORDER BY created_at ASC;
$$;

-- 3. Performance Indexes
-- Optimize conversation lookup by user
CREATE INDEX IF NOT EXISTS idx_conversations_user1
  ON conversations (user1_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user2
  ON conversations (user2_id);

-- Composite index for unread count queries
CREATE INDEX IF NOT EXISTS idx_message_status_user_status
  ON message_status (user_id, status)
  WHERE status != 'read';

-- 4. Message Status Enhancement
-- Add separate timestamp columns for delivery/read tracking
ALTER TABLE message_status 
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- 5. Enhanced Notifications Trigger
-- Increment unread count for receiver on new message
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

-- Create the trigger (drop first if exists to avoid duplicates)
DROP TRIGGER IF EXISTS increment_unread_trigger ON messages;
CREATE TRIGGER increment_unread_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_on_message();