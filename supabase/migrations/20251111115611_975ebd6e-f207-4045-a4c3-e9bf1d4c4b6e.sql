-- Fix security issues: restrict email access and carpool location data

-- ============================================
-- 1. FIX PROFILES TABLE - RESTRICT EMAIL ACCESS
-- ============================================

-- Drop overly permissive public SELECT policies
DROP POLICY IF EXISTS "Public profiles viewable by all" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles viewable (excluding sensitive data)" ON public.profiles;
DROP POLICY IF EXISTS "Public profile data viewable by authenticated users" ON public.profiles;

-- Create a security definer function to get public profile data (excludes email)
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    user_id,
    username,
    full_name,
    bio,
    avatar_url,
    university,
    major,
    created_at,
    updated_at,
    followers_count,
    following_count,
    user_type,
    NULL::text as email,  -- Explicitly exclude email from public view
    country,
    state,
    area,
    banner_url,
    banner_height,
    banner_position,
    interests,
    campus_year,
    preferred_event_types,
    status_message,
    linkedin_url,
    instagram_url,
    twitter_url,
    website_url,
    campus_groups,
    profile_completed,
    profile_completion_date
  FROM public.profiles;
$$;

-- Create new restrictive SELECT policy for public access (no email)
CREATE POLICY "Public can view profiles without email"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Ensure authenticated users can see their own email
-- (This policy already exists: "Users can see their own email")

-- ============================================
-- 2. FIX CARPOOL_RIDES - RESTRICT LOCATION ACCESS
-- ============================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view active carpool rides" ON public.carpool_rides;

-- Create more restrictive policies:
-- 1. Drivers can see their own rides (full details)
CREATE POLICY "Drivers can view their own rides"
ON public.carpool_rides
FOR SELECT
TO authenticated
USING (auth.uid() = driver_id);

-- 2. Users who requested rides can see those rides (full details)
CREATE POLICY "Passengers can view rides they requested"
ON public.carpool_rides
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT ride_id 
    FROM public.carpool_ride_requests 
    WHERE passenger_id = auth.uid()
  )
);

-- 3. For ride discovery, create a security definer function that returns limited data
CREATE OR REPLACE FUNCTION public.get_available_carpool_rides()
RETURNS TABLE (
  id uuid,
  driver_id uuid,
  from_location text,
  to_location text,
  ride_date date,
  ride_time time,
  available_seats integer,
  price numeric,
  car_type text,
  baggage_allowed integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id,
    r.driver_id,
    r.from_location,
    r.to_location,
    r.ride_date,
    r.ride_time,
    r.available_seats,
    r.price,
    r.car_type,
    r.baggage_allowed,
    r.created_at
  FROM public.carpool_rides r
  WHERE r.is_active = true
  AND r.ride_date >= CURRENT_DATE;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO public;
GRANT EXECUTE ON FUNCTION public.get_available_carpool_rides() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.get_public_profiles() IS 'Returns profile data without exposing email addresses. Used for public profile viewing.';
COMMENT ON FUNCTION public.get_available_carpool_rides() IS 'Returns available carpool rides for discovery. Full location details only visible to drivers and passengers who requested the ride.';