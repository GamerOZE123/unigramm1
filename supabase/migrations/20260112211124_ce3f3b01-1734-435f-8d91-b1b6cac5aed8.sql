-- Drop the old check constraint
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_type_check;

-- Update existing company users to business in profiles
UPDATE public.profiles SET user_type = 'business' WHERE user_type = 'company';

-- Update subscriptions table  
UPDATE public.subscriptions SET user_type = 'business' WHERE user_type = 'company';

-- Add new check constraint including 'business'
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_type_check CHECK (user_type IN ('student', 'business', 'clubs', 'company'));