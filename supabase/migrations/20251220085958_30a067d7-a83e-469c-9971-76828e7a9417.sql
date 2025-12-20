-- Create table for post club mentions (similar to post_startup_mentions)
CREATE TABLE public.post_club_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_post_club_mentions_post_id ON public.post_club_mentions(post_id);
CREATE INDEX idx_post_club_mentions_club_id ON public.post_club_mentions(club_id);

-- Enable RLS
ALTER TABLE public.post_club_mentions ENABLE ROW LEVEL SECURITY;

-- Anyone can view club mentions
CREATE POLICY "Anyone can view post club mentions"
ON public.post_club_mentions
FOR SELECT
USING (true);

-- Only authenticated users can insert their own mentions
CREATE POLICY "Authenticated users can create club mentions"
ON public.post_club_mentions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Only the post owner can delete mentions
CREATE POLICY "Post owners can delete their club mentions"
ON public.post_club_mentions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.id = post_club_mentions.post_id 
    AND posts.user_id = auth.uid()
  )
);