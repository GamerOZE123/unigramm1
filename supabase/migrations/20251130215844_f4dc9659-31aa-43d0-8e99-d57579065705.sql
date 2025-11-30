-- Drop and recreate ranked_posts view to include visibility column
DROP VIEW IF EXISTS ranked_posts;

CREATE VIEW ranked_posts AS
SELECT 
  posts.*,
  profiles.full_name,
  profiles.username,
  profiles.avatar_url,
  profiles.university,
  profiles.major,
  -- Enhanced scoring algorithm
  (
    (posts.likes_count * 3) +
    (posts.comments_count * 5) +
    (posts.views_count * 0.1) +
    (CASE WHEN posts.created_at > NOW() - INTERVAL '24 hours' THEN 50 ELSE 0 END) +
    (CASE WHEN posts.created_at > NOW() - INTERVAL '7 days' THEN 20 ELSE 0 END)
  ) AS score
FROM posts
LEFT JOIN profiles ON posts.user_id = profiles.user_id
ORDER BY score DESC, posts.created_at DESC;