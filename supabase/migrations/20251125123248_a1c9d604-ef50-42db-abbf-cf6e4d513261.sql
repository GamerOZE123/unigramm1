-- Drop existing view if it exists
DROP VIEW IF EXISTS public.ranked_posts;

-- Create a view for ranked posts with pre-calculated scores
CREATE VIEW public.ranked_posts AS
SELECT 
  posts.*,
  profiles.full_name,
  profiles.username,
  profiles.avatar_url,
  profiles.university,
  profiles.major,
  (
    100 - EXTRACT(EPOCH FROM (NOW() - posts.created_at)) / 3600 +
    (COALESCE(posts.likes_count, 0) * 3) +
    (COALESCE(posts.comments_count, 0) * 5) +
    (COALESCE(posts.views_count, 0) * 0.05)
  ) as score
FROM public.posts
LEFT JOIN public.profiles ON posts.user_id = profiles.user_id;