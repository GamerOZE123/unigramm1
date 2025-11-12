-- Fix infinite recursion in chat_group_members SELECT policy
-- This policy was causing recursion by querying the same table it protects

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON public.chat_group_members;
DROP POLICY IF EXISTS "View members if in group" ON public.chat_group_members;
DROP POLICY IF EXISTS "Allow any member to select group membership data" ON public.chat_group_members;
DROP POLICY IF EXISTS "select_members" ON public.chat_group_members;

-- Create a non-recursive policy that checks via chat_groups table
CREATE POLICY "Members can view group membership"
ON public.chat_group_members
FOR SELECT
TO authenticated
USING (
  -- Users can see their own membership
  auth.uid() = user_id
  OR
  -- Group creators can see all members
  EXISTS (
    SELECT 1 FROM public.chat_groups
    WHERE chat_groups.id = chat_group_members.group_id
    AND chat_groups.created_by = auth.uid()
  )
);