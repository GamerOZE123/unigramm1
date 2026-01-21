-- Recreate ranked_posts view with proximity-based ranking
-- Hierarchy: Following (+10) → Same University (+5) → Same State (+3) → Same Country (+1.5)

CREATE OR REPLACE VIEW ranked_posts AS
WITH viewer AS (
  SELECT 
    pr.user_id AS viewer_id,
    pr.university,
    pr.major,
    u.state AS viewer_state,
    u.country AS viewer_country
  FROM profiles pr
  LEFT JOIN universities u ON u.name = pr.university
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
    post_uni.state AS post_state,
    post_uni.country AS post_country,
    -- Engagement score (normalized)
    (COALESCE(p.likes_count, 0) * 3 + COALESCE(p.comments_count, 0) * 5 + COALESCE(p.views_count, 0) * 0.1)::numeric AS engagement_raw,
    -- Recency decay (exponential, 24h half-life)
    EXP(-GREATEST(0, EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600) / 24) AS recency_score
  FROM posts p
  JOIN profiles prof ON prof.user_id = p.user_id
  LEFT JOIN universities post_uni ON post_uni.name = prof.university
),
with_proximity AS (
  SELECT 
    b.*,
    -- Following bonus (+10)
    CASE WHEN uf.following_id IS NOT NULL THEN 10.0 ELSE 0.0 END AS following_bonus,
    -- Same university bonus (+5)
    CASE WHEN v.university IS NOT NULL AND b.university = v.university THEN 5.0 ELSE 0.0 END AS university_bonus,
    -- Same state bonus (+3)
    CASE WHEN v.viewer_state IS NOT NULL AND b.post_state = v.viewer_state THEN 3.0 ELSE 0.0 END AS state_bonus,
    -- Same country bonus (+1.5)
    CASE WHEN v.viewer_country IS NOT NULL AND b.post_country = v.viewer_country THEN 1.5 ELSE 0.0 END AS country_bonus
  FROM base b
  LEFT JOIN viewer v ON true
  LEFT JOIN user_following uf ON uf.following_id = b.user_id
),
with_impressions AS (
  SELECT 
    wp.*,
    CASE WHEN pi.post_id IS NULL THEN 5.0 ELSE 0.0 END AS unseen_bonus
  FROM with_proximity wp
  LEFT JOIN post_impressions pi ON pi.post_id = wp.id 
    AND pi.user_id = auth.uid() 
    AND pi.seen_at > (now() - INTERVAL '7 days')
)
SELECT 
  id,
  user_id,
  content,
  image_url,
  likes_count,
  comments_count,
  created_at,
  updated_at,
  hashtags,
  image_urls,
  views_count,
  image_thumbnail_url,
  image_medium_url,
  image_original_url,
  visibility,
  post_type,
  poll_question,
  poll_options,
  poll_ends_at,
  survey_questions,
  startup_id,
  is_approved_for_startup,
  full_name,
  username,
  avatar_url,
  university,
  major,
  -- Final score calculation
  (
    -- Normalized engagement (0-1 range, capped at ~100 engagement points)
    (engagement_raw / (engagement_raw + 20)) * 1.0
    -- Recency boost (0-1.2 range)
    + recency_score * 1.2
    -- Fresh content bonus (posts < 24h)
    + CASE WHEN created_at > now() - INTERVAL '24 hours' THEN 50.0 ELSE 0.0 END
    -- Proximity bonuses (cascading, can stack)
    + following_bonus    -- +10 for following
    + university_bonus   -- +5 for same university
    + state_bonus        -- +3 for same state
    + country_bonus      -- +1.5 for same country
    -- Unseen bonus
    + unseen_bonus       -- +5 for unseen posts
  ) AS score
FROM with_impressions;