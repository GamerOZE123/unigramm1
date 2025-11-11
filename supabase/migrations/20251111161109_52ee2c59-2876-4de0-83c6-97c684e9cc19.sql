-- Fix chat_groups RLS policy for INSERT
DROP POLICY IF EXISTS "Users can create groups" ON public.chat_groups;

CREATE POLICY "Users can create groups"
ON public.chat_groups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Create pinned_messages table for group chat
CREATE TABLE public.pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, message_id)
);

-- Enable RLS on pinned_messages
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for pinned_messages
CREATE POLICY "Group members can view pinned messages"
ON public.pinned_messages
FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Group admins can pin messages"
ON public.pinned_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE group_id = pinned_messages.group_id
    AND user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Group admins can unpin messages"
ON public.pinned_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE group_id = pinned_messages.group_id
    AND user_id = auth.uid()
    AND role = 'admin'
  )
);