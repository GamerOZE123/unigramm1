-- Add post_type column to posts table
ALTER TABLE public.posts 
ADD COLUMN post_type text NOT NULL DEFAULT 'post';

-- Update existing posts based on their content
UPDATE public.posts 
SET post_type = CASE 
  WHEN poll_question IS NOT NULL THEN 'poll'
  WHEN survey_questions IS NOT NULL THEN 'survey'
  ELSE 'post'
END;

-- Add check constraint to ensure valid post types
ALTER TABLE public.posts 
ADD CONSTRAINT posts_post_type_check 
CHECK (post_type IN ('post', 'poll', 'survey'));