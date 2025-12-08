-- Drop and recreate the ranked_posts view with the missing post_type column
DROP VIEW IF EXISTS ranked_posts;

CREATE VIEW ranked_posts AS
SELECT 
    posts.id,
    posts.user_id,
    posts.content,
    posts.image_url,
    posts.likes_count,
    posts.comments_count,
    posts.created_at,
    posts.updated_at,
    posts.hashtags,
    posts.image_urls,
    posts.views_count,
    posts.image_thumbnail_url,
    posts.image_medium_url,
    posts.image_original_url,
    posts.visibility,
    posts.post_type,
    posts.poll_question,
    posts.poll_options,
    posts.poll_ends_at,
    posts.survey_questions,
    posts.startup_id,
    posts.is_approved_for_startup,
    profiles.full_name,
    profiles.username,
    profiles.avatar_url,
    profiles.university,
    profiles.major,
    (COALESCE(posts.likes_count, 0) * 3 + COALESCE(posts.comments_count, 0) * 5 + COALESCE(posts.views_count, 0))::numeric AS score
FROM posts
LEFT JOIN profiles ON profiles.user_id = posts.user_id;