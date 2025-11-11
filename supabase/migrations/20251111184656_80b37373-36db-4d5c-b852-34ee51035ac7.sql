-- Create anonymous messages table for ghost mode
CREATE TABLE IF NOT EXISTS public.anonymous_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  university TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anonymous_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view messages from their university"
  ON public.anonymous_messages
  FOR SELECT
  USING (
    university = (
      SELECT university 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert anonymous messages"
  ON public.anonymous_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND university = (
      SELECT university 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_anonymous_messages_university_created 
  ON public.anonymous_messages(university, created_at DESC);