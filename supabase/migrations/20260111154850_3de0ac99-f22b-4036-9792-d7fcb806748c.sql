-- Create a table for tracking completed semesters
CREATE TABLE public.semester_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester_number INTEGER NOT NULL,
  semester_type TEXT NOT NULL CHECK (semester_type IN ('fall', 'spring')),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, semester_number)
);

-- Enable Row Level Security
ALTER TABLE public.semester_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own semester completions" 
ON public.semester_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own semester completions" 
ON public.semester_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own semester completions" 
ON public.semester_completions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_semester_completions_user_id ON public.semester_completions(user_id);
CREATE INDEX idx_semester_completions_completed_at ON public.semester_completions(completed_at DESC);