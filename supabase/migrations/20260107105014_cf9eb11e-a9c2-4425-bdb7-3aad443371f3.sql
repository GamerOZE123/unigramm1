-- Add is_pinned column to posts table for profile pinning
ALTER TABLE public.posts ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries on pinned posts per user
CREATE INDEX idx_posts_user_pinned ON public.posts (user_id, is_pinned DESC, created_at DESC);