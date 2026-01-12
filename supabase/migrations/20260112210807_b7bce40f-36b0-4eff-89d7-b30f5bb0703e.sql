-- Add 'business' to the user_type enum
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'business';

-- Rename company_profiles table to business_profiles
ALTER TABLE public.company_profiles RENAME TO business_profiles;

-- Rename columns in business_profiles
ALTER TABLE public.business_profiles RENAME COLUMN company_name TO business_name;
ALTER TABLE public.business_profiles RENAME COLUMN company_description TO business_description;
ALTER TABLE public.business_profiles RENAME COLUMN company_size TO business_size;