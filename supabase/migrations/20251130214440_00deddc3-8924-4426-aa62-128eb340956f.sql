-- Add visibility column to posts table
ALTER TABLE posts ADD COLUMN visibility text DEFAULT 'global' CHECK (visibility IN ('global', 'university'));

-- Create index for better filtering performance
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_posts_visibility_university ON posts(visibility, user_id) WHERE visibility = 'university';