-- Create startup interests table to track users interested in startups
CREATE TABLE IF NOT EXISTS public.startup_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.student_startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(startup_id, user_id)
);

-- Enable RLS
ALTER TABLE public.startup_interests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Startup interests are viewable by everyone"
  ON public.startup_interests
  FOR SELECT
  USING (true);

CREATE POLICY "Users can mark startups as interesting"
  ON public.startup_interests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their interest"
  ON public.startup_interests
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_startup_interests_startup_id ON public.startup_interests(startup_id);
CREATE INDEX idx_startup_interests_user_id ON public.startup_interests(user_id);