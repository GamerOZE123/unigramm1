# Security Hardening Plan

## CRON_SECRET rotation
`pg_cron` is not enabled in this project — your cron jobs run from an external scheduler. Update the `x-cron-secret` header value in your scheduler to the new secret. No DB change required on my side. The edge functions (`process-deletions`, `send-message-notification`) already read the new value from `Deno.env.get('CRON_SECRET')`.

## Single migration covering all 9 findings

### 1. Notifications fabrication (Error)
Add restrictive INSERT policy. SECURITY DEFINER triggers (likes/comments/messages) bypass RLS, so they keep working — only direct client inserts get blocked.
```sql
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### 2. Email + push tokens leak on profiles (Error)
Column-level REVOKE — owners still read these via existing `get_my_sensitive_profile_fields()` RPC. Mobile/web continue to read username, full_name, avatar, etc.
```sql
REVOKE SELECT (email, personal_email, push_token, push_token_type, push_token_updated_at)
  ON public.profiles FROM anon, authenticated;
```

### 3. Student resume_url leak (Warning)
Column REVOKE on `resume_url`. Skills, certificates, education stay visible.
```sql
REVOKE SELECT (resume_url) ON public.student_profiles FROM anon, authenticated;
DROP POLICY "Authenticated users can view student profiles" ON public.student_profiles;
CREATE POLICY "Owner can view own student profile" ...USING (auth.uid()=user_id);
CREATE POLICY "Authenticated can view student profile basics" ...USING (true);
```

### 4. admin_team_members hashed passwords (Warning)
Explicit deny-all SELECT + REVOKE on `password` column. The `verify_admin_team_password()` RPC (SECURITY DEFINER) keeps working for login.
```sql
CREATE POLICY "Deny all client reads" ON public.admin_team_members
  FOR SELECT TO anon, authenticated USING (false);
REVOKE SELECT (password) ON public.admin_team_members FROM anon, authenticated;
```

### 5. account_deletion_requests anon insert (Warning)
Replace `WITH CHECK (true)` with auth match. **Side effect:** the unauthenticated "I can't log in" deletion path in `DeleteAccount.tsx` (line 88-90) will now require sign-in. If a user can't log in, they'll need to use the password reset flow first or contact support. Acceptable trade-off vs. anyone deleting any account by guessing emails.
```sql
DROP POLICY "Anyone can submit deletion request" ON public.account_deletion_requests;
CREATE POLICY "Authenticated users can submit own deletion request"
  ON public.account_deletion_requests FOR INSERT TO authenticated
  WITH CHECK (
    email = (SELECT email FROM profiles WHERE user_id = auth.uid())
    OR username = (SELECT username FROM profiles WHERE user_id = auth.uid())
  );
```

### 6. Dating photos uploadable to any path (Warning)
Enforce uploader-owned folder.
```sql
DROP POLICY "Upload Dating Images" ON storage.objects;
CREATE POLICY "Authenticated users can upload own dating images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='dating-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 7. Post videos deletable by anyone (Warning)
Enforce owner subfolder. Path convention: `post_videos/<user_uid>/<filename>`.
```sql
DROP POLICY "Users can delete own videos in posts bucket" ON storage.objects;
CREATE POLICY "Users can delete own videos in posts bucket"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='posts' AND name LIKE 'post_videos/%' 
         AND (storage.foldername(name))[2] = auth.uid()::text);
```

### 8. Admin edge function rate limiting (Warning)
**Skipping per Lovable platform policy** — the backend has no rate-limiting primitives yet. Will mark this finding as a known accepted gap in security memory. The function already uses timing-safe password comparison.

### 9. Admin password hashes returned to client (Warning)
Already mitigated: `verify_admin_team_password()` only returns `id, name, email, allowed_sections`. Step 4 (deny-read + REVOKE on password column) makes it structurally impossible to ever leak even if a future code path tries.

## What will NOT break
- Mobile app: only reads `username, full_name, avatar_url, bio, university, ...` — none of the revoked columns
- Push registration: writes via `update`/`upsert`, not select — unaffected
- Admin login: uses RPC, unaffected
- Profile editing: uses verify-admin function which has service-role privileges
- Notification triggers (likes, comments, DMs): SECURITY DEFINER bypasses RLS

## Files touched
- One DB migration (covers everything above)
- Mark security findings 1–7 + 9 as fixed; mark 8 as ignored with reason
- Update security memory document