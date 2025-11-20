-- Create student_startups table
CREATE TABLE IF NOT EXISTS public.student_startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('idea', 'mvp', 'launched', 'growing')),
  looking_for TEXT[] DEFAULT '{}',
  website_url TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_startups ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view startups
CREATE POLICY "Everyone can view startups"
  ON public.student_startups
  FOR SELECT
  USING (true);

-- Allow users to create their own startups
CREATE POLICY "Users can create their own startups"
  ON public.student_startups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own startups
CREATE POLICY "Users can update their own startups"
  ON public.student_startups
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own startups
CREATE POLICY "Users can delete their own startups"
  ON public.student_startups
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_student_startups_updated_at
  BEFORE UPDATE ON public.student_startups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_student_startups_user_id ON public.student_startups(user_id);
CREATE INDEX idx_student_startups_created_at ON public.student_startups(created_at DESC);