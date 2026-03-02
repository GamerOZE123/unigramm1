DROP VIEW IF EXISTS public.ranked_posts;

CREATE VIEW public.ranked_posts AS
SELECT p.id,
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
    p.startup_id,
    p.poll_question,
    p.poll_options,
    p.poll_ends_at,
    p.survey_questions,
    p.is_approved_for_startup,
    p.post_type,
    p.is_pinned,
    p.poll_votes,
    p.survey_responses,
    p.image_metadata,
    p.video_url,
    pr.full_name,
    pr.username,
    pr.avatar_url,
    pr.university,
    pr.major,
    COALESCE(((p.likes_count * 2 + p.comments_count * 5)::numeric + p.views_count::numeric * 0.1 + 1::numeric) / pow(EXTRACT(epoch FROM now() - p.created_at) / 3600::numeric + 2::numeric, 1.8), 0::numeric) AS score
   FROM posts p
     LEFT JOIN profiles pr ON p.user_id = pr.user_id
  WHERE p.is_hidden = false;