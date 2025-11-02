-- Create chat_groups table
CREATE TABLE IF NOT EXISTS public.chat_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for chat_groups
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;

-- Create chat_group_members table
CREATE TABLE IF NOT EXISTS public.chat_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS for chat_group_members
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;

-- Create group_messages table
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for group_messages
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_groups
CREATE POLICY "Users can view groups they are members of"
  ON public.chat_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE chat_group_members.group_id = chat_groups.id
      AND chat_group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON public.chat_groups
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their groups"
  ON public.chat_groups
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE chat_group_members.group_id = chat_groups.id
      AND chat_group_members.user_id = auth.uid()
      AND chat_group_members.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete their groups"
  ON public.chat_groups
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE chat_group_members.group_id = chat_groups.id
      AND chat_group_members.user_id = auth.uid()
      AND chat_group_members.role = 'admin'
    )
  );

-- RLS Policies for chat_group_members
CREATE POLICY "Users can view members of groups they belong to"
  ON public.chat_group_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_group_members AS cgm
      WHERE cgm.group_id = chat_group_members.group_id
      AND cgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group creators can add members"
  ON public.chat_group_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE chat_group_members.group_id = group_id
      AND chat_group_members.user_id = auth.uid()
      AND chat_group_members.role = 'admin'
    )
  );

CREATE POLICY "Users can leave groups"
  ON public.chat_group_members
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can remove members"
  ON public.chat_group_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_group_members AS cgm
      WHERE cgm.group_id = chat_group_members.group_id
      AND cgm.user_id = auth.uid()
      AND cgm.role = 'admin'
    )
  );

-- RLS Policies for group_messages
CREATE POLICY "Group members can view messages"
  ON public.group_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE chat_group_members.group_id = group_messages.group_id
      AND chat_group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON public.group_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE chat_group_members.group_id = group_messages.group_id
      AND chat_group_members.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_group_members_group_id ON public.chat_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_group_members_user_id ON public.chat_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON public.group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON public.group_messages(created_at DESC);

-- Create trigger for updating updated_at on chat_groups
CREATE OR REPLACE FUNCTION update_chat_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_groups_updated_at_trigger
  BEFORE UPDATE ON public.chat_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_groups_updated_at();