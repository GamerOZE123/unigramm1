

## Plan: Handle Password Reset from Mobile App on Website

### Problem
When a user clicks "Forgot Password" in the mobile app, the reset email is sent. Clicking the reset link opens the website (unigramm.com), but instead of showing a password reset form, it shows an "open app" prompt. The app can't handle this deep link, so nothing happens.

### Solution
Make the website properly handle the password reset flow end-to-end, and after success, prompt the user to return to the app.

### Changes

**1. `src/pages/Auth.tsx`**
- After successful password reset (line 324), change the success message to: "Password updated successfully! You can now return to the app and login with your new password."
- Sign out the user after password reset so they don't get auto-redirected to `/home` (they need to log in from the app instead).

**2. `src/pages/Index.tsx`** (Landing page — already partially handled)
- The existing code already redirects auth hash fragments from `/` to `/auth`. Verify this covers all recovery scenarios (PKCE `code` param in addition to hash fragments).
- Add detection for `?code=` query parameter and redirect to `/auth?code=...` so PKCE recovery flows also work on the landing page.

**3. Ensure `redirectTo` consistency**
- In `handleForgotPassword`, the `redirectTo` currently uses `window.location.origin`. When called from the mobile app, this may produce a Capacitor URL that isn't whitelisted. However, since the mobile app can't be changed, we need to ensure the **Supabase redirect URL whitelist** includes `https://unigramm.com/auth`.
- No code change needed here — this is a Supabase dashboard configuration step.

### Technical Details

- **Auth.tsx reset success flow**: After `updateUser({ password })` succeeds, call `supabase.auth.signOut()` to clear the session, then show the "return to app" message. This prevents the `onAuthStateChange` listener from redirecting to `/home`.
- **Index.tsx**: Add `window.location.search` check for `code` param alongside existing hash fragment checks, redirecting to `/auth` with preserved query string.
- **Supabase Dashboard**: Ensure `https://unigramm.com/auth` is in the Redirect URLs list under Authentication → URL Configuration.

