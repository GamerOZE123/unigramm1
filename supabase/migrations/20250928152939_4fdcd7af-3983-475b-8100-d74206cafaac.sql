-- Add all missing columns systematically

-- Fix advertising tables
ALTER TABLE public.advertising_posts 
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

ALTER TABLE public.advertising_clicks 
ADD COLUMN IF NOT EXISTS advertising_post_id uuid REFERENCES public.advertising_posts(id) ON DELETE CASCADE;

ALTER TABLE public.advertising_likes 
ADD COLUMN IF NOT EXISTS advertising_post_id uuid REFERENCES public.advertising_posts(id) ON DELETE CASCADE;

-- Fix jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS salary_range text,
ADD COLUMN IF NOT EXISTS job_type text,
ADD COLUMN IF NOT EXISTS experience_level text,
ADD COLUMN IF NOT EXISTS skills_required text[],
ADD COLUMN IF NOT EXISTS application_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS requirements text,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Fix student_profiles table  
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS experience_level text,
ADD COLUMN IF NOT EXISTS preferred_job_types text[],
ADD COLUMN IF NOT EXISTS preferred_location text,
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS work_experience text,
ADD COLUMN IF NOT EXISTS certificates text[],
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS github_url text,
ADD COLUMN IF NOT EXISTS portfolio_url text,
ADD COLUMN IF NOT EXISTS university text,
ADD COLUMN IF NOT EXISTS major text,
ADD COLUMN IF NOT EXISTS graduation_year integer,
ADD COLUMN IF NOT EXISTS gpa numeric(3,2),
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Fix company_profiles table
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS company_description text,
ADD COLUMN IF NOT EXISTS company_size text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS company_logo text,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Fix job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.student_profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS applied_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Fix job_swipes table
ALTER TABLE public.job_swipes 
ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.student_profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS swipe_direction text,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Fix posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS image_urls text[];

-- Fix profiles table (add user_id for backwards compatibility)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Update user_id to match id where it's null
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;