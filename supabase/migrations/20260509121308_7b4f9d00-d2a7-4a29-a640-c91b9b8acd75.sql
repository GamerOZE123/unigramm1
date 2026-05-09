
-- 1) student_stores.bank_details — column-level REVOKE so SELECT * cannot leak it
REVOKE SELECT (bank_details) ON public.student_stores FROM anon, authenticated;

-- 2) group_messages — remove privilege escalation via sender_id IS NULL
DROP POLICY IF EXISTS "Users can insert messages into groups they are members of" ON public.group_messages;
CREATE POLICY "Members can insert messages"
  ON public.group_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE group_id = group_messages.group_id
        AND user_id = auth.uid()
    )
  );
-- "System messages insert policy" already enforces membership + sender_id IS NULL + message_type='system' — keep it.

-- 3) recap_albums — enforce visibility
DROP POLICY IF EXISTS "Public can read recap_albums" ON public.recap_albums;
DROP POLICY IF EXISTS "albums_select" ON public.recap_albums;
CREATE POLICY "View recap_albums by visibility"
  ON public.recap_albums FOR SELECT TO authenticated
  USING (
    visibility = 'public'
    OR created_by = auth.uid()
    OR (invited_users IS NOT NULL AND auth.uid() = ANY (invited_users))
    OR EXISTS (
      SELECT 1 FROM public.club_memberships cm
      WHERE cm.club_id = recap_albums.club_id
        AND cm.user_id = auth.uid()
    )
  );

-- 4) recap_media — enforce parent-album visibility
DROP POLICY IF EXISTS "Public can read recap_media" ON public.recap_media;
DROP POLICY IF EXISTS "media_select" ON public.recap_media;
CREATE POLICY "View recap_media via album visibility"
  ON public.recap_media FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recap_albums a
      WHERE a.id = recap_media.album_id
        AND (
          a.visibility = 'public'
          OR a.created_by = auth.uid()
          OR (a.invited_users IS NOT NULL AND auth.uid() = ANY (a.invited_users))
          OR EXISTS (
            SELECT 1 FROM public.club_memberships cm
            WHERE cm.club_id = a.club_id
              AND cm.user_id = auth.uid()
          )
        )
    )
  );

-- 5) Convert SECURITY DEFINER views to security_invoker
ALTER VIEW public.trending_hashtags SET (security_invoker = true);
ALTER VIEW public.student_discounts_safe SET (security_invoker = true);
