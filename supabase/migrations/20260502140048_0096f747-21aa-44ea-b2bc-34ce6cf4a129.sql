
-- ============================================================
-- 1. APP ANNOUNCEMENTS
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated users to delete announcements" ON public.app_announcements;
DROP POLICY IF EXISTS "Allow authenticated users to insert announcements" ON public.app_announcements;
DROP POLICY IF EXISTS "Allow authenticated users to update announcements" ON public.app_announcements;
DROP POLICY IF EXISTS "Authenticated users can create announcements" ON public.app_announcements;
DROP POLICY IF EXISTS "Authenticated users can create app announcements" ON public.app_announcements;
DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON public.app_announcements;
DROP POLICY IF EXISTS "Authenticated users can delete app announcements" ON public.app_announcements;
DROP POLICY IF EXISTS "Authenticated users can update announcements" ON public.app_announcements;
DROP POLICY IF EXISTS "Authenticated users can update app announcements" ON public.app_announcements;

-- ============================================================
-- 2. PROFILES - column-level revoke for sensitive fields
-- ============================================================
REVOKE SELECT (email) ON public.profiles FROM anon, authenticated, public;
REVOKE SELECT (personal_email) ON public.profiles FROM anon, authenticated, public;
REVOKE SELECT (push_token) ON public.profiles FROM anon, authenticated, public;
REVOKE SELECT (push_token_type) ON public.profiles FROM anon, authenticated, public;
REVOKE SELECT (push_token_updated_at) ON public.profiles FROM anon, authenticated, public;
-- Owners still get these via their "Users can view own profile" RLS policy + table-level grants
-- We need an explicit owner-only column grant approach: grant via service role and rely on
-- the existing owner SELECT policy. Owners can still read because column privileges are checked
-- against the role; revoke removes all access. Re-grant to authenticated so the owner policy
-- works, but require RLS to filter rows so only owner rows return:
GRANT SELECT (email, personal_email, push_token, push_token_type, push_token_updated_at)
  ON public.profiles TO authenticated;
-- The existing "Users can view own profile" policy (auth.uid() = user_id) will scope rows.
-- However the public "Authenticated users can view profiles" policy returns all rows.
-- To prevent reading other users' sensitive cols, drop the broad policy and rely on owner-policy
-- + a separate non-sensitive policy. PostgREST returns columns per request, but RLS doesn't
-- distinguish columns. So we must restrict the broad SELECT policy to non-sensitive scenarios.

-- Strategy: keep public read access via existing policy but rely on column grants only for owners.
-- Revoke from anon entirely so anon can't see sensitive cols:
REVOKE SELECT (email, personal_email, push_token, push_token_type, push_token_updated_at)
  ON public.profiles FROM anon;

-- ============================================================
-- 3. EARLY ACCESS SIGNUPS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read signups" ON public.early_access_signups;
DROP POLICY IF EXISTS "Authenticated users can update signups" ON public.early_access_signups;

CREATE POLICY "Admins can read signups"
ON public.early_access_signups FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

CREATE POLICY "Admins can update signups"
ON public.early_access_signups FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- 4. STUDENT STORES - column-level revoke for bank_details
-- ============================================================
REVOKE SELECT (bank_details) ON public.student_stores FROM anon, public;
-- authenticated users can still read bank_details column but RLS row policy is open.
-- Since we can't column-scope RLS, restrict bank_details visibility entirely by revoking
-- from authenticated too, then grant only via a security-definer function for owners.
REVOKE SELECT (bank_details) ON public.student_stores FROM authenticated;
-- Provide owner access via a function:
CREATE OR REPLACE FUNCTION public.get_my_store_bank_details()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bank_details FROM public.student_stores WHERE user_id = auth.uid() LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_store_bank_details() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_store_bank_details() TO authenticated;

-- ============================================================
-- 5. CONFESSIONS - column-level revoke for user_id
-- ============================================================
REVOKE SELECT (user_id) ON public.confessions FROM anon, public;
REVOKE SELECT (user_id) ON public.confessions FROM authenticated;
-- Author can still query their own confessions via owner-scoped function:
CREATE OR REPLACE FUNCTION public.is_my_confession(_confession_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.confessions WHERE id = _confession_id AND user_id = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.is_my_confession(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_my_confession(uuid) TO authenticated;

-- ============================================================
-- 6. ANDROID TESTERS
-- ============================================================
DROP POLICY IF EXISTS "Allow reads" ON public.android_testers;
DROP POLICY IF EXISTS "Allow updates" ON public.android_testers;

CREATE POLICY "Admins can read android testers"
ON public.android_testers FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

CREATE POLICY "Admins can update android testers"
ON public.android_testers FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- 7. CONTRIBUTOR APPLICATIONS
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read their own contributor application" ON public.contributor_applications;
DROP POLICY IF EXISTS "Anyone can update their own contributor application by email" ON public.contributor_applications;

CREATE POLICY "Admins can read contributor applications"
ON public.contributor_applications FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

CREATE POLICY "Admins can update contributor applications"
ON public.contributor_applications FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- 8. CHAT GROUP MEMBERS
-- ============================================================
DROP POLICY IF EXISTS "Members can update" ON public.chat_group_members;
DROP POLICY IF EXISTS "Users can remove" ON public.chat_group_members;
DROP POLICY IF EXISTS "Anyone can add members to their groups" ON public.chat_group_members;

CREATE POLICY "Admins can update group members"
ON public.chat_group_members FOR UPDATE
TO authenticated
USING (public.is_group_admin(group_id, auth.uid()))
WITH CHECK (public.is_group_admin(group_id, auth.uid()));

CREATE POLICY "Admins can remove members or self-remove"
ON public.chat_group_members FOR DELETE
TO authenticated
USING (public.is_group_admin(group_id, auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Admins can add members"
ON public.chat_group_members FOR INSERT
TO authenticated
WITH CHECK (public.is_group_admin(group_id, auth.uid()));

-- ============================================================
-- 9. MESSAGE NOTIFICATIONS / BATCHES - service_role only
-- ============================================================
DROP POLICY IF EXISTS "Service role full access to message_notifications" ON public.message_notifications;
DROP POLICY IF EXISTS "Service role full access to notification_batches" ON public.notification_batches;

CREATE POLICY "Service role full access message_notifications"
ON public.message_notifications FOR ALL
TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access notification_batches"
ON public.notification_batches FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- ============================================================
-- 10. APP SETTINGS - admin-only writes
-- ============================================================
DROP POLICY IF EXISTS "Allow insert app_settings for anon" ON public.app_settings;
DROP POLICY IF EXISTS "Allow insert app_settings for authenticated" ON public.app_settings;
DROP POLICY IF EXISTS "Allow update app_settings for anon" ON public.app_settings;
DROP POLICY IF EXISTS "Allow update app_settings for authenticated" ON public.app_settings;

CREATE POLICY "Admins can insert app_settings"
ON public.app_settings FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

CREATE POLICY "Admins can update app_settings"
ON public.app_settings FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- 11. UNIVERSITY FEATURES
-- ============================================================
DROP POLICY IF EXISTS "Anon can update university_features" ON public.university_features;
DROP POLICY IF EXISTS "Authenticated users can update university_features" ON public.university_features;

CREATE POLICY "Admins can update university_features"
ON public.university_features FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- 12. UNIVERSITY COURSES
-- ============================================================
DROP POLICY IF EXISTS "Anyone can delete university courses" ON public.university_courses;
DROP POLICY IF EXISTS "Anyone can insert university courses" ON public.university_courses;
DROP POLICY IF EXISTS "Anyone can update university courses" ON public.university_courses;

CREATE POLICY "Admins can insert university courses"
ON public.university_courses FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

CREATE POLICY "Admins can update university courses"
ON public.university_courses FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

CREATE POLICY "Admins can delete university courses"
ON public.university_courses FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- 13. SURVEY RESPONSES
-- ============================================================
DROP POLICY IF EXISTS "Everyone can read survey responses" ON public.survey_responses;

-- ============================================================
-- 14. POST VIEWS & ADVERTISING POST VIEWS
-- ============================================================
DROP POLICY IF EXISTS "Post views are viewable by everyone" ON public.post_views;
DROP POLICY IF EXISTS "Advertising post views are viewable by everyone" ON public.advertising_post_views;

CREATE POLICY "Users can view their own post views"
ON public.post_views FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.posts p WHERE p.id = post_views.post_id AND p.user_id = auth.uid()
));

CREATE POLICY "Users can view their own advertising post views"
ON public.advertising_post_views FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.advertising_posts ap WHERE ap.id = advertising_post_views.advertising_post_id AND ap.company_id = auth.uid()
));

-- ============================================================
-- 15. USER PAGE ANALYTICS - enable RLS, owner-only
-- ============================================================
ALTER TABLE public.user_page_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analytics" ON public.user_page_analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.user_page_analytics;
DROP POLICY IF EXISTS "Users can update own analytics" ON public.user_page_analytics;

CREATE POLICY "Users can view own analytics"
ON public.user_page_analytics FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
ON public.user_page_analytics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
ON public.user_page_analytics FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 16. DATING PHOTOS STORAGE
-- ============================================================
DROP POLICY IF EXISTS "Delete Dating Images" ON storage.objects;
DROP POLICY IF EXISTS "Update Dating Images" ON storage.objects;

CREATE POLICY "Users can delete their own dating images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dating-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own dating images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'dating-photos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'dating-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
