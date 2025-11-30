-- Add startup_id column to posts table to link posts to startups
ALTER TABLE posts ADD COLUMN IF NOT EXISTS startup_id UUID REFERENCES student_startups(id) ON DELETE SET NULL;

-- Create index for faster startup post queries
CREATE INDEX IF NOT EXISTS idx_posts_startup_id ON posts(startup_id);