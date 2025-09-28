-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS major TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS banner_position TEXT DEFAULT 'center',
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'student',
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Add missing columns to auction_bids table
ALTER TABLE public.auction_bids 
ADD COLUMN IF NOT EXISTS auction_id UUID REFERENCES public.auctions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS amount NUMERIC,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add missing columns to auctions table
ALTER TABLE public.auctions 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS starting_price NUMERIC,
ADD COLUMN IF NOT EXISTS current_price NUMERIC,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS image_urls TEXT[],
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to marketplace_items table
ALTER TABLE public.marketplace_items 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC,
ADD COLUMN IF NOT EXISTS image_urls TEXT[],
ADD COLUMN IF NOT EXISTS condition TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to clubs table
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to jobs table for job applications relation
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create get_or_create_conversation function for messaging
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    conversation_uuid uuid;
BEGIN
    -- Try to find existing conversation
    SELECT c.id INTO conversation_uuid
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = user1_id AND cp2.user_id = user2_id;
    
    -- If no conversation exists, create one
    IF conversation_uuid IS NULL THEN
        INSERT INTO conversations (id, last_message_at)
        VALUES (gen_random_uuid(), now())
        RETURNING id INTO conversation_uuid;
        
        -- Add participants
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES 
            (conversation_uuid, user1_id),
            (conversation_uuid, user2_id);
    END IF;
    
    RETURN conversation_uuid;
END;
$$;