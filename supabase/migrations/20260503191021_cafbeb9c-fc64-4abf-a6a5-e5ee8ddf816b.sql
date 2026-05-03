
-- 1) NOTIFICATIONS: restrict INSERT to self only
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2) PROFILES: hide sensitive columns from non-owners (column-level REVOKE).
-- Owner self-access continues via get_my_sensitive_profile_fields() RPC.
REVOKE SELECT (email, personal_email, push_token, push_token_type, push_token_updated_at)
  ON public.profiles FROM anon, authenticated;

-- 3) STUDENT_PROFILES: hide resume_url and tighten policies
REVOKE SELECT (resume_url) ON public.student_profiles FROM anon, authenticated;

DROP POLICY IF EXISTS "Authenticated users can view student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Owner can view own student profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Authenticated can view student profile basics" ON public.student_profiles;

CREATE POLICY "Owner can view own student profile"
  ON public.student_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated can view student profile basics"
  ON public.student_profiles FOR SELECT
  TO authenticated
  USING (true);

-- 4) ADMIN_TEAM_MEMBERS: block all client reads + revoke password column
DROP POLICY IF EXISTS "Deny all client reads" ON public.admin_team_members;
CREATE POLICY "Deny all client reads"
  ON public.admin_team_members FOR SELECT
  TO anon, authenticated
  USING (false);

REVOKE SELECT (password) ON public.admin_team_members FROM anon, authenticated;

-- 5) ACCOUNT_DELETION_REQUESTS: require auth + match own account
DROP POLICY IF EXISTS "Anyone can submit deletion request" ON public.account_deletion_requests;
DROP POLICY IF EXISTS "Authenticated users can submit own deletion request" ON public.account_deletion_requests;

CREATE POLICY "Authenticated users can submit own deletion request"
  ON public.account_deletion_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    email = (SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid())
    OR username = (SELECT p.username FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- 6) STORAGE: dating-photos uploads must go to user's own folder
DROP POLICY IF EXISTS "Upload Dating Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload own dating images" ON storage.objects;
CREATE POLICY "Authenticated users can upload own dating images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dating-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 7) STORAGE: post videos can only be deleted by owner (path: post_videos/<uid>/...)
DROP POLICY IF EXISTS "Users can delete own videos in posts bucket" ON storage.objects;
CREATE POLICY "Users can delete own videos in posts bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'posts'
    AND name LIKE 'post_videos/%'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
