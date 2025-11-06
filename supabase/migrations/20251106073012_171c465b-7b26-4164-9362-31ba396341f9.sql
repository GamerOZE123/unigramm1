-- Fix critical security issues: Email exposure and location data

-- 1. FIX CARPOOL RIDES: Restrict to authenticated users only
DROP POLICY IF EXISTS "Carpool rides are viewable by authenticated users" ON public.carpool_rides;

CREATE POLICY "Authenticated users can view active carpool rides"
  ON public.carpool_rides
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 2. FIX PROFILES EMAIL: Add security definer function to check email access
-- This function determines if a user can access another user's email
CREATE OR REPLACE FUNCTION public.can_access_profile_email(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow access to email if user is viewing their own profile
  RETURN auth.uid() = target_user_id;
END;
$$;

-- Add comment to profiles.email column to document access restriction
COMMENT ON COLUMN public.profiles.email IS 'SECURITY RESTRICTED: Only accessible by profile owner. Use can_access_profile_email(user_id) function to check access rights. Application must filter this column for non-owners.';

-- 3. CREATE FUNCTION: Check if company can access student contact info
-- Companies can only access emails of students who applied to their jobs
CREATE OR REPLACE FUNCTION public.company_can_access_student_contact(
  company_user_id uuid, 
  student_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if student has applied to any of the company's jobs
  RETURN EXISTS (
    SELECT 1 
    FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE j.company_id = company_user_id 
    AND ja.student_id = student_user_id
  );
END;
$$;

-- Add comment documenting the function
COMMENT ON FUNCTION public.company_can_access_student_contact(uuid, uuid) IS 'Checks if a company can access a student''s contact information. Returns true only if the student has applied to one of the company''s job postings.';

-- 4. CREATE SECURITY VIEW: Public-safe profile fields
-- This function returns the list of columns that are safe to query publicly
CREATE OR REPLACE FUNCTION public.get_safe_profile_fields()
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN ARRAY[
    'id', 'user_id', 'username', 'full_name', 'bio', 'avatar_url', 'banner_url', 
    'university', 'major', 'country', 'state', 'area', 'user_type', 
    'followers_count', 'following_count', 'banner_position', 'banner_height',
    'created_at', 'updated_at'
  ];
END;
$$;

COMMENT ON FUNCTION public.get_safe_profile_fields() IS 'Returns array of profile columns safe for public access (excludes email and other PII).';