-- Create conversation_pinned_messages table for 1-on-1 chats
CREATE TABLE public.conversation_pinned_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  message_id UUID NOT NULL,
  pinned_by UUID NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, message_id)
);

-- Enable RLS
ALTER TABLE public.conversation_pinned_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view pinned messages in their conversations"
  ON public.conversation_pinned_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can pin messages in their conversations"
  ON public.conversation_pinned_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = pinned_by AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "Users can unpin messages in their conversations"
  ON public.conversation_pinned_messages
  FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX idx_conversation_pinned_messages_conversation_id 
  ON public.conversation_pinned_messages(conversation_id);
CREATE INDEX idx_conversation_pinned_messages_message_id 
  ON public.conversation_pinned_messages(message_id);