-- Enable realtime for key tables by setting replica identity and adding to publication
-- Only add tables that aren't already in the publication

-- Set replica identity to FULL for tables that need realtime updates
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.follows REPLICA IDENTITY FULL;
ALTER TABLE public.advertising_posts REPLICA IDENTITY FULL;
ALTER TABLE public.job_applications REPLICA IDENTITY FULL;
ALTER TABLE public.recent_chats REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.post_views REPLICA IDENTITY FULL;
ALTER TABLE public.advertising_post_views REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication (skip messages as it's already there)
DO $$
BEGIN
    -- Check and add posts
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    END IF;

    -- Check and add comments
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    END IF;

    -- Check and add likes
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'likes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
    END IF;

    -- Check and add notifications
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;

    -- Check and add follows
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'follows'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
    END IF;

    -- Check and add advertising_posts
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'advertising_posts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.advertising_posts;
    END IF;

    -- Check and add job_applications
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'job_applications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.job_applications;
    END IF;

    -- Check and add recent_chats
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'recent_chats'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.recent_chats;
    END IF;

    -- Check and add profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;

    -- Check and add post_views
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'post_views'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.post_views;
    END IF;

    -- Check and add advertising_post_views
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'advertising_post_views'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.advertising_post_views;
    END IF;
END $$;