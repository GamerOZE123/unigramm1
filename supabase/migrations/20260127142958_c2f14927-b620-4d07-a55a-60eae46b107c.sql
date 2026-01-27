-- =============================================================
-- Chat System Fixes - Unread Count & Sync Pagination
-- =============================================================

-- FIX #1: Update get_user_conversations_v2 to use pre-computed unread counts
-- Instead of recalculating from message_status (which is slow and redundant)
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
    -- Use pre-computed counts instead of recalculating
    CASE 
      WHEN c.user1_id = auth.uid() THEN COALESCE(c.unread_count_user1, 0)
      ELSE COALESCE(c.unread_count_user2, 0)
    END::int AS unread_count
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

-- FIX #2: Add function to reset unread count when user opens chat
CREATE OR REPLACE FUNCTION public.reset_unread_count(convo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET 
    unread_count_user1 = CASE 
      WHEN user1_id = auth.uid() THEN 0 
      ELSE unread_count_user1 
    END,
    unread_count_user2 = CASE 
      WHEN user2_id = auth.uid() THEN 0 
      ELSE unread_count_user2 
    END
  WHERE id = convo_id
    AND (user1_id = auth.uid() OR user2_id = auth.uid());
END;
$$;

-- FIX #3: Update sync_messages with pagination (LIMIT 500)
CREATE OR REPLACE FUNCTION public.sync_messages(
  convo_id uuid,
  since_ts timestamptz,
  msg_limit int DEFAULT 500
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
  ORDER BY created_at ASC
  LIMIT msg_limit;
$$;

-- FIX #4: Add improved composite index for message ordering + pagination
CREATE INDEX IF NOT EXISTS idx_messages_convo_created_id
  ON messages (conversation_id, created_at, id);