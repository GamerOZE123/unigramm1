-- Add missing columns to posts table for likes
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to fitness_challenges table
ALTER TABLE public.fitness_challenges 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS challenge_type TEXT DEFAULT 'steps',
ADD COLUMN IF NOT EXISTS target_value INTEGER DEFAULT 10000,
ADD COLUMN IF NOT EXISTS target_unit TEXT DEFAULT 'steps',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to challenge_participants table
ALTER TABLE public.challenge_participants 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS current_progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to holiday_events table
ALTER TABLE public.holiday_events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add missing columns to marketplace_categories table
ALTER TABLE public.marketplace_categories 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Create missing database functions
CREATE OR REPLACE FUNCTION public.get_challenge_participant_count(challenge_uuid uuid)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM challenge_participants
  WHERE challenge_id = challenge_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_recent_chats(user_uuid uuid)
RETURNS TABLE(
  id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message text,
  last_message_time timestamp with time zone,
  unread_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    cp2.user_id as other_user_id,
    p.full_name as other_user_name,
    p.avatar_url as other_user_avatar,
    ''::text as last_message,
    c.last_message_at as last_message_time,
    0 as unread_count
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = user_uuid
  JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != user_uuid
  JOIN profiles p ON cp2.user_id = p.user_id
  ORDER BY c.last_message_at DESC
  LIMIT 20;
END;
$$;