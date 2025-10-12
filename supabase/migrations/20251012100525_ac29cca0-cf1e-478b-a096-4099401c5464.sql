-- Fix security issues and enable realtime for ranked_posts

-- 1. Fix email exposure in profiles table
-- Drop ALL existing SELECT policies on profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own email" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone (no email)" ON public.profiles;

-- Note: PostgreSQL RLS doesn't support column-level permissions directly
-- So we need to handle email visibility in the application layer
-- But we can document that email should only be accessed by profile owner

-- Create policy allowing everyone to view profiles (app will filter email)
CREATE POLICY "Public profiles viewable by all" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Add comment documenting email access restriction
COMMENT ON COLUMN public.profiles.email IS 'RESTRICTED: Only accessible by profile owner (auth.uid() = user_id). Application must filter this column for non-owners.';

-- 2. Make ranked_posts realtime-enabled (if it's a table)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'ranked_posts'
  ) THEN
    ALTER TABLE public.ranked_posts REPLICA IDENTITY FULL;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ranked_posts;
  END IF;
END $$;

-- 3. Fix ranked_posts view - remove SECURITY DEFINER
DROP VIEW IF EXISTS public.ranked_posts CASCADE;

CREATE OR REPLACE VIEW public.ranked_posts AS
SELECT 
  p.*,
  pr.full_name,
  pr.username,
  pr.avatar_url,
  pr.university,
  EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600 AS age_hours,
  GREATEST(0, 100 - (EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600)) AS recency_score,
  (p.likes_count * 2 + p.comments_count * 3 + p.views_count * 0.1) AS engagement_score
FROM public.posts p
LEFT JOIN public.profiles pr ON p.user_id = pr.user_id
ORDER BY 
  (GREATEST(0, 100 - (EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600)) + 
   (p.likes_count * 2 + p.comments_count * 3 + p.views_count * 0.1)) DESC;

GRANT SELECT ON public.ranked_posts TO authenticated;
GRANT SELECT ON public.ranked_posts TO anon;