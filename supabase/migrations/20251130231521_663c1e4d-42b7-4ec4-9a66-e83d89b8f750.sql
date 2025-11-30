-- Add poll and survey support to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS poll_question TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS poll_options JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS poll_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS survey_questions JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_approved_for_startup BOOLEAN DEFAULT false;

-- Create table for mentioned startups in posts
CREATE TABLE IF NOT EXISTS post_startup_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES student_startups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, startup_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_post_startup_mentions_startup ON post_startup_mentions(startup_id);
CREATE INDEX IF NOT EXISTS idx_post_startup_mentions_post ON post_startup_mentions(post_id);

-- Create table for poll votes
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create table for survey responses
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  responses JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE post_startup_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Policies for post_startup_mentions
CREATE POLICY "Anyone can view post mentions"
  ON post_startup_mentions FOR SELECT
  USING (true);

CREATE POLICY "Users can create mentions in their posts"
  ON post_startup_mentions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete mentions from their posts"
  ON post_startup_mentions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );

-- Policies for poll_votes
CREATE POLICY "Anyone can view poll votes"
  ON poll_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote on polls"
  ON poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for survey_responses
CREATE POLICY "Users can view their own survey responses"
  ON survey_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit survey responses"
  ON survey_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);