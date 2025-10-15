-- Add new columns to profiles table for onboarding data
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS campus_year text,
ADD COLUMN IF NOT EXISTS preferred_event_types text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status_message text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS campus_groups text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completion_date timestamptz;

-- Add length constraint for status message
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'status_message_length'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT status_message_length CHECK (char_length(status_message) <= 150);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_interests ON profiles USING gin(interests);
CREATE INDEX IF NOT EXISTS idx_profiles_campus_year ON profiles(campus_year);
CREATE INDEX IF NOT EXISTS idx_profiles_completed ON profiles(profile_completed) WHERE profile_completed = false;