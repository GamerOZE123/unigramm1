
-- Step 1: Remove the legacy club_id column from posts (references clubs table)
ALTER TABLE public.posts DROP COLUMN IF EXISTS club_id;

-- Step 2: Drop club_links table (references clubs table)
DROP TABLE IF EXISTS public.club_links;

-- Step 3: Drop the legacy clubs table
DROP TABLE IF EXISTS public.clubs;
