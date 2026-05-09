# Security Errors — Exhaustive Breakdown

I verified each finding against the live DB (`pg_policies`, column grants, `pg_class` views, `storage.buckets`). Below is what each finding actually means, the live evidence, real-world impact, and the proposed fix. **No code/DB changes yet** — approve and I'll apply migrations.

---

## ERROR 1 — Team member section restrictions enforced client-side only
**Source:** `agent_security` / `team_member_section_bypass` · Category: Admin Authorization

### What's wrong
The `verify-admin` Edge Function returns an `allowed_sections` array. The admin React UI uses it to hide tabs (see `AdminSidebar.tsx`). But the function itself does **not** check that the requested `action` belongs to the caller's allowed sections. A team member with `allowed_sections: ['waitlist']` can `curl` the function directly with any action.

### Concrete attack actions a limited team member can invoke
- `delete_user` — permanently delete any user + their auth row
- `broadcast_batch` — push notifications to every user
- `fetch_users` / `fetch_auth_users` — exfiltrate every email + profile
- `update_app_config`, `approve_waitlist`, etc.

### Fix (server-side allow-list)
Inside `verify-admin/index.ts`, after authenticating the team member:
1. If `isMainAdmin === true` → bypass.
2. Otherwise build a map `section → [actions]`, e.g.:
   - `waitlist` → `['fetch_waitlist','approve_waitlist','reject_waitlist']`
   - `users` → `['fetch_users','update_user','delete_user']`
   - `broadcast` → `['broadcast_batch']`
   - …
3. Reject with HTTP 403 if `action` is not in the union of actions allowed by the member's `allowed_sections`.

This is the **only error here that requires editing application code** (an Edge Function). The other 5 are pure DB/RLS fixes.

---

## ERROR 2 — `student_stores.bank_details` exposed to all authenticated users
**Source:** `supabase_lov` / `student_stores_bank_details_authenticated_read`

### Live evidence
```
Policy: stores_public_read   USING (auth.uid() IS NOT NULL)   role: public   cmd: SELECT
Policy: Owners can view own store with bank details   USING (auth.uid()=user_id)
Column REVOKE check on student_stores.bank_details → NO column privileges row found
   (means default table-level SELECT grant still covers bank_details)
```

### Why it's dangerous
The earlier security memory claimed `bank_details` was column-revoked, but `information_schema.column_privileges` returns **no entry** — the column is not specifically revoked. Combined with the broad `auth.uid() IS NOT NULL` SELECT policy, **any logged-in user** can `SELECT bank_details FROM student_stores` and read every store's bank account info (account number, IFSC, beneficiary name, etc.).

### Fix
1. `REVOKE SELECT (bank_details) ON public.student_stores FROM anon, authenticated;`
2. Tighten `stores_public_read` to expose only public storefront fields (or replace it with a view `student_stores_public` that omits `bank_details`).
3. Keep `Owners can view own store with bank details` for the owner.
4. Provide a `SECURITY DEFINER` RPC `get_my_store_bank_details()` for the owner UI if needed.

---

## ERROR 3 — Privilege escalation via system messages in `group_messages`
**Source:** `supabase_lov` / `group_messages_system_insert_privilege_escalation`

### Live evidence — two overlapping INSERT policies
```
Policy A: "Users can insert messages into groups they are members of"  role: authenticated
   WITH CHECK ((EXISTS member of group) OR (sender_id IS NULL))   ← BUG

Policy B: "System messages insert policy"  role: public
   WITH CHECK (message_type='system' AND sender_id IS NULL AND member of group)  ← correct
```

### Why it's dangerous
RLS checks pass if **any** policy passes. Policy A's `OR (sender_id IS NULL)` short-circuits the membership check. So **any authenticated user can insert a row into ANY `group_id`** — even private groups they were never invited to — by simply setting `sender_id = NULL`. This lets attackers inject fake "system" messages ("Alice was kicked", "New admin assigned", arbitrary text) into any group chat in the platform.

### Fix
Drop policy A and recreate it without the OR clause:
```sql
DROP POLICY "Users can insert messages into groups they are members of" ON public.group_messages;
CREATE POLICY "Members can insert messages"
  ON public.group_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM chat_group_members
                WHERE group_id = group_messages.group_id AND user_id = auth.uid())
  );
```
Keep "System messages insert policy" as the only path for `sender_id IS NULL` rows (it already requires membership + `message_type='system'`).

---

## ERROR 4 — Private/invite-only `recap_albums` readable by anonymous internet users
**Source:** `supabase_lov` / `recap_albums_visibility_not_enforced_anon`

### Live evidence — TWO competing SELECT policies
```
"Public can read recap_albums"  role: public  USING (true)        ← exposes everything to anon
"albums_select"                 role: authenticated  USING (true)  ← also too broad
```
The `recap_albums` table has a `visibility` column (`public` / `private` / `invite_only`) and an `invited_users` array, but **neither** policy checks them.

### Why it's dangerous
Anyone on the public internet (no login) can `SELECT * FROM recap_albums` and list every private/invite-only album's metadata (title, club_id, cover image, created_by). Photos that the club expected to be private are discoverable.

### Fix
```sql
DROP POLICY "Public can read recap_albums" ON public.recap_albums;
DROP POLICY "albums_select" ON public.recap_albums;

CREATE POLICY "View recap_albums by visibility"
  ON public.recap_albums FOR SELECT TO authenticated
  USING (
    visibility = 'public'
    OR created_by = auth.uid()
    OR auth.uid() = ANY (invited_users)
    OR EXISTS (SELECT 1 FROM club_memberships cm
               WHERE cm.club_id = recap_albums.club_id AND cm.user_id = auth.uid())
  );
```

---

## ERROR 5 — `recap_media` readable by anonymous users regardless of album visibility
**Source:** `supabase_lov` / `recap_media_no_album_visibility_check_anon`

### Live evidence
```
"Public can read recap_media"  role: public  USING (true)
"media_select"                 role: authenticated  USING (true)
```
Same shape as Error 4. Even if Error 4 is fixed, an attacker could bypass it by querying `recap_media` directly to enumerate photo URLs of private albums.

### Fix
```sql
DROP POLICY "Public can read recap_media" ON public.recap_media;
DROP POLICY "media_select" ON public.recap_media;

CREATE POLICY "View recap_media via album visibility"
  ON public.recap_media FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recap_albums a
    WHERE a.id = recap_media.album_id
      AND (
        a.visibility = 'public'
        OR a.created_by = auth.uid()
        OR auth.uid() = ANY (a.invited_users)
        OR EXISTS (SELECT 1 FROM club_memberships cm
                   WHERE cm.club_id = a.club_id AND cm.user_id = auth.uid())
      )
  ));
```

---

## ERROR 6 — SECURITY DEFINER view (Supabase linter)
**Source:** `supabase` / `SUPA_security_definer_view`

### Live evidence
Two views in `public` are `SECURITY DEFINER` (run as `postgres` owner, bypassing RLS of the caller):
- `public.trending_hashtags`
- `public.student_discounts_safe`

(`profiles_public`, `ranked_posts`, `anonymous_messages_view` are already `security_invoker=true` — fine.)

### Why it's a finding
A `SECURITY DEFINER` view ignores the querying user's RLS and runs with the creator's permissions. If the underlying tables have RLS protecting per-user data, that protection is silently stripped when accessed via the view.

### Fix
Convert both views to `security_invoker`:
```sql
ALTER VIEW public.trending_hashtags SET (security_invoker = true);
ALTER VIEW public.student_discounts_safe SET (security_invoker = true);
```
Then verify the tables they read from still permit the expected anon/authenticated SELECT (they should — these views are intentionally "public read" surfaces for trending tags and the public discount catalog). If anything breaks, we add a narrow `TO authenticated USING (...)` policy on the underlying table.

---

## Quick map of warnings (FYI, not in scope of "errors")
- `contributor_applications` — anon INSERT allowed, no rate limit. Mitigation: edge-function or captcha; keep write-only.
- `early_access_signups` — admin-only SELECT depends on `is_admin` flag integrity (currently sound).
- `posts` — `is_hidden` / `visibility` not enforced in RLS (currently filtered in client/`ranked_posts`).
- `chat-media` bucket is public — anyone with URL can read; signed URLs would be safer.

---

## Proposed execution order
1. **One DB migration** covering Errors 2, 3, 4, 5, 6 (pure RLS / column REVOKE / view ALTER).
2. **One Edge Function edit** for Error 1 (`verify-admin/index.ts` — server-side action allow-list).
3. Mark all six findings as fixed and re-run the security scan.

Approve and I'll proceed.
