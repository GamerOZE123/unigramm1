-- Add academic timeline and account status fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'student' CHECK (account_status IN ('student', 'alumni', 'verified_alumni')),
ADD COLUMN IF NOT EXISTS academic_year TEXT,
ADD COLUMN IF NOT EXISTS start_year INTEGER,
ADD COLUMN IF NOT EXISTS expected_graduation_year INTEGER,
ADD COLUMN IF NOT EXISTS graduated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS personal_email TEXT;

-- Add graduation control fields to universities
ALTER TABLE public.universities 
ADD COLUMN IF NOT EXISTS allow_graduation_button BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS program_duration_years INTEGER DEFAULT 4;

-- Create alumni_verifications table for degree/LinkedIn verification
CREATE TABLE IF NOT EXISTS public.alumni_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('degree', 'linkedin')),
  document_url TEXT,
  linkedin_profile_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on alumni_verifications
ALTER TABLE public.alumni_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for alumni_verifications
CREATE POLICY "Users can view their own verifications"
ON public.alumni_verifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verifications"
ON public.alumni_verifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending verifications"
ON public.alumni_verifications FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Create year_reviews table for yearly campus wrapped
CREATE TABLE IF NOT EXISTS public.year_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  academic_year_number INT NOT NULL CHECK (academic_year_number BETWEEN 1 AND 6),
  year_completed INT NOT NULL,
  overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
  academics_rating INT CHECK (academics_rating BETWEEN 1 AND 5),
  social_rating INT CHECK (social_rating BETWEEN 1 AND 5),
  campus_rating INT CHECK (campus_rating BETWEEN 1 AND 5),
  career_rating INT CHECK (career_rating BETWEEN 1 AND 5),
  clubs_rating INT CHECK (clubs_rating BETWEEN 1 AND 5),
  what_went_well TEXT,
  what_was_bad TEXT,
  advice_for_juniors TEXT,
  wrapped_data JSONB,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, academic_year_number)
);

-- Enable RLS on year_reviews
ALTER TABLE public.year_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for year_reviews
CREATE POLICY "Users can view their own reviews"
ON public.year_reviews FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public reviews"
ON public.year_reviews FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can create their own reviews"
ON public.year_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.year_reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Create university_reviews table
CREATE TABLE IF NOT EXISTS public.university_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  university TEXT NOT NULL,
  major TEXT,
  graduation_year INT,
  review_text TEXT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on university_reviews
ALTER TABLE public.university_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for university_reviews
CREATE POLICY "Anyone can view university reviews"
ON public.university_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reviews"
ON public.university_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.university_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.university_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_university ON public.profiles(university);
CREATE INDEX IF NOT EXISTS idx_year_reviews_user_id ON public.year_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_year_reviews_public ON public.year_reviews(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_university_reviews_university ON public.university_reviews(university);
CREATE INDEX IF NOT EXISTS idx_alumni_verifications_user_id ON public.alumni_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_alumni_verifications_status ON public.alumni_verifications(status);