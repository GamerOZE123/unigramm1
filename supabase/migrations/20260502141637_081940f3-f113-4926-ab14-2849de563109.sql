-- Effective column-level SELECT restriction requires removing the table-wide SELECT first.

-- profiles: remove broad SELECT and re-grant only safe columns to anon/authenticated.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, user_id, username, full_name, bio, avatar_url, university, major,
  created_at, updated_at, followers_count, following_count, user_type,
  country, state, area, banner_url, banner_height, banner_position,
  interests, campus_year, preferred_event_types, status_message,
  linkedin_url, instagram_url, twitter_url, website_url,
  profile_completed, profile_completion_date, account_status,
  academic_year, start_year, expected_graduation_year, graduated_at,
  course_id, age, gender, deactivated_at, deletion_scheduled_at,
  university_id, degree_level, approved, is_admin
) ON public.profiles TO anon, authenticated;

-- student_stores: remove broad SELECT and re-grant only safe columns.
REVOKE SELECT ON public.student_stores FROM anon, authenticated;

GRANT SELECT (
  id, user_id, store_name, store_description, store_logo_url,
  payment_methods, is_active, created_at, updated_at
) ON public.student_stores TO anon, authenticated;
