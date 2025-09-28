-- Add missing columns to advertising_post_views table
ALTER TABLE public.advertising_post_views 
ADD COLUMN IF NOT EXISTS advertising_post_id UUID REFERENCES public.advertising_posts(id) ON DELETE CASCADE;

-- Add missing columns to cleared_chats table
ALTER TABLE public.cleared_chats 
ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS conversation_id UUID;

-- Add missing columns to deleted_chats table  
ALTER TABLE public.deleted_chats 
ADD COLUMN IF NOT EXISTS conversation_id UUID,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Add missing columns to conversation_participants table
ALTER TABLE public.conversation_participants 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to holiday_events table
ALTER TABLE public.holiday_events 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS max_attendees INTEGER,
ADD COLUMN IF NOT EXISTS current_attendees INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to clubs table
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- Create get_user_conversations function for chat
CREATE OR REPLACE FUNCTION public.get_user_conversations(user_uuid uuid)
RETURNS TABLE(
  id uuid,
  last_message_at timestamp with time zone,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.last_message_at,
    cp2.user_id as other_user_id,
    p.full_name as other_user_name,
    p.avatar_url as other_user_avatar
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = user_uuid
  JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != user_uuid
  JOIN profiles p ON cp2.user_id = p.user_id
  ORDER BY c.last_message_at DESC;
END;
$$;