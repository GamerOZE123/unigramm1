-- Drop all existing policies on chat_groups to start fresh
DROP POLICY IF EXISTS "Admins can delete their groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Admins can update their groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Chat groups insert by owner" ON public.chat_groups;
DROP POLICY IF EXISTS "Chat groups select by owner" ON public.chat_groups;
DROP POLICY IF EXISTS "Chat groups update by owner" ON public.chat_groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.chat_groups;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.chat_groups;

-- Create clean, simple policies for chat_groups
-- Allow users to insert groups where they are the creator
CREATE POLICY "Users can create their own groups"
ON public.chat_groups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow users to view groups where they are the creator OR a member
CREATE POLICY "Users can view their groups"
ON public.chat_groups
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by 
  OR EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE chat_group_members.group_id = chat_groups.id
    AND chat_group_members.user_id = auth.uid()
  )
);

-- Allow group creators and admins to update groups
CREATE POLICY "Group creators and admins can update groups"
ON public.chat_groups
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE chat_group_members.group_id = chat_groups.id
    AND chat_group_members.user_id = auth.uid()
    AND chat_group_members.role IN ('admin', 'owner')
  )
);

-- Allow group creators and admins to delete groups
CREATE POLICY "Group creators and admins can delete groups"
ON public.chat_groups
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE chat_group_members.group_id = chat_groups.id
    AND chat_group_members.user_id = auth.uid()
    AND chat_group_members.role IN ('admin', 'owner')
  )
);