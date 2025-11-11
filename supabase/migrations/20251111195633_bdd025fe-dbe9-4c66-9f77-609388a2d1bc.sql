-- Create anonymous_message_reactions table
CREATE TABLE public.anonymous_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.anonymous_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.anonymous_message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view all reactions
CREATE POLICY "Users can view anonymous message reactions"
ON public.anonymous_message_reactions
FOR SELECT
USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add their own reactions"
ON public.anonymous_message_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON public.anonymous_message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_anonymous_reactions_message ON public.anonymous_message_reactions(message_id);
CREATE INDEX idx_anonymous_reactions_user ON public.anonymous_message_reactions(user_id);