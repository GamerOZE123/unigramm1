
-- 1. Restrict analytics insert policies to authenticated users
DROP POLICY IF EXISTS "Anyone can record post views" ON public.post_views;
CREATE POLICY "Authenticated can record post views"
ON public.post_views FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can record advertising post views" ON public.advertising_post_views;
CREATE POLICY "Authenticated can record advertising post views"
ON public.advertising_post_views FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can record banner views" ON public.homepage_banner_views;
CREATE POLICY "Authenticated can record banner views"
ON public.homepage_banner_views FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create banner clicks" ON public.homepage_banner_clicks;
CREATE POLICY "Authenticated can create banner clicks"
ON public.homepage_banner_clicks FOR INSERT TO authenticated
WITH CHECK (true);

-- 2. Remove user-driven INSERT on notifications (trigger functions are SECURITY DEFINER and bypass RLS)
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;

-- 3. Tighten quest-proofs storage upload to user-scoped folder
DROP POLICY IF EXISTS "Allow auth upload on quest-proofs" ON storage.objects;
DROP POLICY IF EXISTS "quest_proofs_upload" ON storage.objects;

CREATE POLICY "quest_proofs_upload_owner_folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'quest-proofs'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR (auth.uid())::text = (storage.foldername(name))[2]
  )
);

-- 4. Tighten realtime.messages SELECT/INSERT policies to remove blanket access
--    to bare 'messages' and 'dating-matches-realtime' topics.
DROP POLICY IF EXISTS "Authenticated users can receive allowed realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can send allowed realtime messages" ON realtime.messages;

CREATE POLICY "Authenticated users can receive allowed realtime messages"
ON realtime.messages FOR SELECT TO authenticated
USING (
  (NOT COALESCE(private, false))
  OR (topic = ANY (ARRAY[
    'home-feed','startup_posts','confessions-feed','anon-chat',
    'club-status-changes','carpool-updates','chat-unread-badge',
    'group-unread-badge','blocked-users-realtime','recent-chats-updates',
    'profiles-updates-for-chats','unread-messages','chat-groups-updates',
    'club-join-requests','waitlist-access-check'
  ]))
  OR (topic = ('notifications:'::text || (auth.uid())::text))
  OR (topic = ('dating-matches:'::text || (auth.uid())::text))
  OR ((topic ~ '^group-messages-[0-9a-f-]{36}$') AND public.is_group_member(auth.uid(), (substring(topic from 16))::uuid))
  OR ((topic ~ '^community-messages-[0-9a-f-]{36}$') AND public.is_community_member((substring(topic from 20))::uuid, auth.uid()))
  OR ((topic ~ '^message-reactions-[0-9a-f-]{36}$') AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = (substring(realtime.messages.topic from 19))::uuid
          AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      ))
  OR ((topic ~ '^dating-messages-[0-9a-f-]{36}$') AND EXISTS (
        SELECT 1 FROM public.dating_matches m
        WHERE m.id = (substring(realtime.messages.topic from 17))::uuid
          AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
      ))
);

CREATE POLICY "Authenticated users can send allowed realtime messages"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  (NOT COALESCE(private, false))
  OR (topic = ('notifications:'::text || (auth.uid())::text))
  OR (topic = ('dating-matches:'::text || (auth.uid())::text))
  OR ((topic ~ '^group-messages-[0-9a-f-]{36}$') AND public.is_group_member(auth.uid(), (substring(topic from 16))::uuid))
  OR ((topic ~ '^community-messages-[0-9a-f-]{36}$') AND public.is_community_member((substring(topic from 20))::uuid, auth.uid()))
  OR ((topic ~ '^message-reactions-[0-9a-f-]{36}$') AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = (substring(realtime.messages.topic from 19))::uuid
          AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      ))
  OR ((topic ~ '^dating-messages-[0-9a-f-]{36}$') AND EXISTS (
        SELECT 1 FROM public.dating_matches m
        WHERE m.id = (substring(realtime.messages.topic from 17))::uuid
          AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
      ))
);
