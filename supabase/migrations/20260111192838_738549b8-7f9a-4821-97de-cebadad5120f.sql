-- Create university_courses table for course-specific durations
CREATE TABLE public.university_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  duration_years INTEGER NOT NULL DEFAULT 4,
  total_semesters INTEGER NOT NULL DEFAULT 8,
  force_enable_graduation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(university_id, course_name)
);

-- Add course_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN course_id UUID REFERENCES public.university_courses(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.university_courses ENABLE ROW LEVEL SECURITY;

-- Everyone can read courses
CREATE POLICY "Anyone can view university courses"
ON public.university_courses
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_university_courses_updated_at
BEFORE UPDATE ON public.university_courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample courses for existing universities (will be empty if no universities exist)
-- Users can fill in the actual data later