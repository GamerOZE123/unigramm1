-- Add slug field to student_startups table
ALTER TABLE student_startups ADD COLUMN slug text UNIQUE;

-- Add index for faster slug lookups
CREATE INDEX idx_student_startups_slug ON student_startups(slug);

-- Create startup_contributors table for team members
CREATE TABLE public.startup_contributors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id UUID NOT NULL REFERENCES student_startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(startup_id, user_id)
);

-- Enable RLS
ALTER TABLE public.startup_contributors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for startup_contributors
CREATE POLICY "Contributors are viewable by everyone"
  ON public.startup_contributors
  FOR SELECT
  USING (true);

CREATE POLICY "Startup owners can add contributors"
  ON public.startup_contributors
  FOR INSERT
  WITH CHECK (
    startup_id IN (
      SELECT id FROM student_startups WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Startup owners can remove contributors"
  ON public.startup_contributors
  FOR DELETE
  USING (
    startup_id IN (
      SELECT id FROM student_startups WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Startup owners can update contributors"
  ON public.startup_contributors
  FOR UPDATE
  USING (
    startup_id IN (
      SELECT id FROM student_startups WHERE user_id = auth.uid()
    )
  );

-- Add index
CREATE INDEX idx_startup_contributors_startup ON startup_contributors(startup_id);
CREATE INDEX idx_startup_contributors_user ON startup_contributors(user_id);