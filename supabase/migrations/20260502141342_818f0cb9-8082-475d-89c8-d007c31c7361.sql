-- Security hardening for current scan findings

-- 1) Sensitive profile columns: revoke direct browser/API reads and provide owner/admin helper.
REVOKE SELECT (email, personal_email, push_token, push_token_type, push_token_updated_at)
  ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_sensitive_profile_fields()
RETURNS TABLE (
  email text,
  personal_email text,
  push_token text,
  push_token_type text,
  push_token_updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email, p.personal_email, p.push_token, p.push_token_type, p.push_token_updated_at
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_profile_email_for_login(_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email
  FROM public.profiles p
  WHERE lower(p.username) = lower(_username)
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_sensitive_profile_fields() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_sensitive_profile_fields() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_profile_email_for_login(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_profile_email_for_login(text) TO anon, authenticated;

-- 2) Store bank details: remove direct reads and keep owner/admin helper access only.
REVOKE SELECT (bank_details) ON public.student_stores FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_store_bank_details()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.bank_details
  FROM public.student_stores s
  WHERE s.user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_store_bank_details() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_store_bank_details() TO authenticated;

-- 3) Points cannot be directly self-awarded or self-edited by clients.
DROP POLICY IF EXISTS "ledger_insert" ON public.points_ledger;
DROP POLICY IF EXISTS "user_points_update" ON public.user_points;

-- Preserve direct reads of public point totals, but point mutations happen through trusted functions/triggers only.
DROP POLICY IF EXISTS "user_points_insert" ON public.user_points;

-- 4) Notifications: remove anonymous arbitrary notification creation.
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

-- Explicitly keep user reads/updates only on their own notifications.
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Optional direct self-notifications only; prevents targeting other users and fixes anonymous insert.
CREATE POLICY "Users can create their own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5) Chat group member insertion: remove unrestricted self-join policies and require group settings/admin ownership.
DROP POLICY IF EXISTS "Members can insert themselves" ON public.chat_group_members;
DROP POLICY IF EXISTS "Allow insert if creator or self" ON public.chat_group_members;
DROP POLICY IF EXISTS "insert_members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Admins can add members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Allow group creator to add initial members" ON public.chat_group_members;

CREATE POLICY "Admins can add group members"
ON public.chat_group_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_group_admin(group_id, auth.uid()));

CREATE POLICY "Users can join groups that allow self add"
ON public.chat_group_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.chat_groups cg
    WHERE cg.id = chat_group_members.group_id
      AND COALESCE(cg.members_can_add, false) = true
  )
);

-- 6) Realtime channel authorization for private/sensitive channels.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive allowed realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can send allowed realtime messages" ON realtime.messages;

CREATE POLICY "Authenticated users can receive allowed realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  NOT COALESCE(private, false)
  OR topic IN ('home-feed', 'startup_posts', 'confessions-feed', 'anon-chat', 'club-status-changes', 'carpool-updates', 'chat-unread-badge', 'group-unread-badge', 'blocked-users-realtime', 'recent-chats-updates', 'profiles-updates-for-chats', 'unread-messages', 'chat-groups-updates', 'club-join-requests', 'waitlist-access-check')
  OR topic = ('notifications:' || auth.uid()::text)
  OR (
    topic ~ '^group-messages-[0-9a-f-]{36}$'
    AND public.is_group_member(auth.uid(), substring(topic from 16)::uuid)
  )
  OR (
    topic ~ '^community-messages-[0-9a-f-]{36}$'
    AND public.is_community_member(substring(topic from 20)::uuid, auth.uid())
  )
  OR (
    topic ~ '^message-reactions-[0-9a-f-]{36}$'
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = substring(topic from 19)::uuid
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  )
  OR (
    topic ~ '^dating-messages-[0-9a-f-]{36}$'
    AND EXISTS (
      SELECT 1 FROM public.dating_matches m
      WHERE m.id = substring(topic from 17)::uuid
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  )
  OR (
    topic IN ('messages', 'dating-matches-realtime')
  )
);

CREATE POLICY "Authenticated users can send allowed realtime messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  NOT COALESCE(private, false)
  OR topic = ('notifications:' || auth.uid()::text)
  OR (
    topic ~ '^group-messages-[0-9a-f-]{36}$'
    AND public.is_group_member(auth.uid(), substring(topic from 16)::uuid)
  )
  OR (
    topic ~ '^community-messages-[0-9a-f-]{36}$'
    AND public.is_community_member(substring(topic from 20)::uuid, auth.uid())
  )
  OR (
    topic ~ '^message-reactions-[0-9a-f-]{36}$'
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = substring(topic from 19)::uuid
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  )
  OR (
    topic ~ '^dating-messages-[0-9a-f-]{36}$'
    AND EXISTS (
      SELECT 1 FROM public.dating_matches m
      WHERE m.id = substring(topic from 17)::uuid
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  )
);

-- 7) Security definer view: make ranked_posts execute with invoker privileges.
ALTER VIEW IF EXISTS public.ranked_posts SET (security_invoker = true);
