-- Add 'clubs' to user_type enum
ALTER TYPE user_type ADD VALUE IF NOT EXISTS 'clubs';

-- Create clubs_profiles table
CREATE TABLE IF NOT EXISTS public.clubs_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  club_name TEXT NOT NULL,
  club_description TEXT,
  logo_url TEXT,
  category TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  university TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on clubs_profiles
ALTER TABLE public.clubs_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for clubs_profiles
CREATE POLICY "Clubs profiles are viewable by everyone"
  ON public.clubs_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Clubs can create their own profile"
  ON public.clubs_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clubs can update their own profile"
  ON public.clubs_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_clubs_profiles_updated_at
  BEFORE UPDATE ON public.clubs_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();