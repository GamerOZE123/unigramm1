
DROP VIEW IF EXISTS public.ranked_posts CASCADE;

CREATE OR REPLACE VIEW public.ranked_posts AS
WITH viewer AS (
  SELECT 
    pr.user_id AS viewer_id,
    pr.university,
    pr.major
  FROM profiles pr
  WHERE pr.user_id = auth.uid()
),
user_following AS (
  SELECT following_id
  FROM follows
  WHERE follower_id = auth.uid()
),
base AS (
  SELECT 
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.likes_count,
    p.comments_count,
    p.created_at,
    p.updated_at,
    p.hashtags,
    p.image_urls,
    p.views_count,
    p.image_thumbnail_url,
    p.image_medium_url,
    p.image_original_url,
    p.visibility,
    p.post_type,
    p.poll_question,
    p.poll_options,
    p.poll_ends_at,
    p.survey_questions,
    p.startup_id,
    p.is_approved_for_startup,
    prof.full_name,
    prof.username,
    prof.avatar_url,
    prof.university,
    prof.major,
    GREATEST(EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600.0, 0.5) AS age_hours
  FROM posts p
  JOIN profiles prof ON prof.user_id = p.user_id
)
SELECT 
  b.id,
  b.user_id,
  b.content,
  b.image_url,
  b.likes_count,
  b.comments_count,
  b.created_at,
  b.updated_at,
  b.hashtags,
  b.image_urls,
  b.views_count,
  b.image_thumbnail_url,
  b.image_medium_url,
  b.image_original_url,
  b.visibility,
  b.post_type,
  b.poll_question,
  b.poll_options,
  b.poll_ends_at,
  b.survey_questions,
  b.startup_id,
  b.is_approved_for_startup,
  b.full_name,
  b.username,
  b.avatar_url,
  b.university,
  b.major,
  (
    -- 1. Engagement Velocity (35%): log-based rate per hour
    LN(1.0 + (COALESCE(b.likes_count, 0) + COALESCE(b.comments_count, 0) * 2.0) / b.age_hours) * 35.0
    -- 2. Recency Decay (25%): exponential decay, 24h half-life
    + 25.0 * EXP(-b.age_hours / 24.0)
    -- 3. Social Proof (20%): capped total engagement volume
    + LEAST((COALESCE(b.likes_count, 0) + COALESCE(b.comments_count, 0)) / 5.0, 50.0) * 0.5
    -- 4. Content Quality (10%): tiered by media type
    + CASE 
        WHEN b.post_type IN ('poll', 'survey') THEN 12.0
        WHEN b.image_urls IS NOT NULL AND array_length(b.image_urls, 1) > 1 THEN 10.0
        WHEN b.image_url IS NOT NULL OR (b.image_urls IS NOT NULL AND array_length(b.image_urls, 1) = 1) THEN 8.0
        ELSE 0.0
      END
    -- 5. Following Bonus (+6)
    + CASE WHEN uf.following_id IS NOT NULL THEN 6.0 ELSE 0.0 END
    -- 6. Same University Bonus (+5)
    + CASE WHEN v.university IS NOT NULL AND b.university = v.university THEN 5.0 ELSE 0.0 END
    -- 7. Same Major/Department Bonus (+3)
    + CASE WHEN v.major IS NOT NULL AND b.major = v.major THEN 3.0 ELSE 0.0 END
    -- 8. Startup/Event Boost (+5)
    + CASE WHEN b.is_approved_for_startup = true THEN 5.0 ELSE 0.0 END
  ) AS score
FROM base b
LEFT JOIN viewer v ON true
LEFT JOIN user_following uf ON uf.following_id = b.user_id;

GRANT SELECT ON public.ranked_posts TO authenticated;
GRANT SELECT ON public.ranked_posts TO anon;
